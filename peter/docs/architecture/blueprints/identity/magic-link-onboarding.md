# Feature Blueprint: Magic Link Onboarding
**Domain:** Identity
**Related Epics:** [Epic 1: Foundation & Core Infrastructure](../../../prd/epic-1.md), [Epic 2: Worker Onboarding & Profile Management](../../../prd/epic-2.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 1.4: Magic Link System](../../../prd/epic-1.md#story-14-magic-link-system)

## Technical Strategy (The "How")

### Magic Link Token Generation

**Token Structure:**
```typescript
import crypto from 'crypto';

interface MagicLinkToken {
  userId?: string; // For existing users
  email?: string; // Optional - fallback only for phone-first authentication (workers may not have email)
  mobileNumber?: string; // Primary identifier for workers - required for SMS delivery (phone-first authentication)
  purpose: 'onboarding' | 'verification' | 'password_reset';
  targetId?: string; // e.g., timesheet_id for verification
  companyId?: string; // Company context
  expiresAt: Date;
}

function generateMagicLinkToken(data: {
  userId?: string;
  email?: string;
  mobileNumber?: string;
  purpose: 'onboarding' | 'verification' | 'password_reset';
  targetId?: string;
  companyId?: string;
}): string {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store token in database with expiration
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  db('magic_link_tokens').insert({
    token_hash: crypto.createHash('sha256').update(token).digest('hex'),
    user_id: data.userId,
    email: data.email,
    mobile_number: data.mobileNumber,
    purpose: data.purpose,
    target_id: data.targetId,
    company_id: data.companyId,
    expires_at: expiresAt,
    used: false
  });

  return token;
}
```

### SMS Integration (Twilio)

**SMS Sending with Fallback:**
```typescript
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendMagicLinkSMS(mobileNumber: string, token: string, purpose: string) {
  const baseUrl = process.env.FRONTEND_URL;
  let deepLink: string;
  let message: string;

  switch (purpose) {
    case 'onboarding':
      deepLink = `${baseUrl}/onboarding?token=${token}`;
      message = `Welcome to SmartBench! Complete your profile: ${deepLink}`;
      break;
    case 'verification':
      deepLink = `${baseUrl}/verify-timesheet?token=${token}`;
      message = `Verify hours for worker: ${deepLink}`;
      break;
    case 'password_reset':
      deepLink = `${baseUrl}/reset-password?token=${token}`;
      message = `Reset your SmartBench password: ${deepLink}`;
      break;
  }

  try {
    // Attempt SMS delivery
    const smsResult = await twilioClient.messages.create({
      body: message,
      to: mobileNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    // Log successful delivery
    await db('notification_logs').insert({
      type: 'sms',
      recipient: mobileNumber,
      status: 'delivered',
      twilio_message_sid: smsResult.sid,
      created_at: new Date()
    });

    return { success: true, method: 'sms', sid: smsResult.sid };
  } catch (error) {
    // SMS delivery failed - fallback to email
    console.error('SMS delivery failed:', error);
    
    // Get user email (if available) for fallback
    // Phone-first: SMS is primary channel, email is fallback only when available
    const user = await db('users')
      .where({ mobile_number: mobileNumber })
      .first();

    if (user && user.email) {
      // Send email fallback
      await sendMagicLinkEmail(user.email, token, purpose);
      
      await db('notification_logs').insert({
        type: 'sms_fallback_email',
        recipient: mobileNumber,
        email_fallback: user.email,
        status: 'email_sent',
        error: error.message,
        created_at: new Date()
      });

      return { success: true, method: 'email_fallback', email: user.email };
    }

    // If no email available, log error
    await db('notification_logs').insert({
      type: 'sms',
      recipient: mobileNumber,
      status: 'failed',
      error: error.message,
      created_at: new Date()
    });

    throw new Error(`SMS delivery failed and no email fallback available: ${error.message}`);
  }
}
```

### Email Fallback (SendGrid)

**Email Sending:**
```typescript
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMagicLinkEmail(email: string, token: string, purpose: string) {
  const baseUrl = process.env.FRONTEND_URL;
  let deepLink: string;
  let subject: string;
  let htmlContent: string;

  switch (purpose) {
    case 'onboarding':
      deepLink = `${baseUrl}/onboarding?token=${token}`;
      subject = 'Welcome to SmartBench - Complete Your Profile';
      htmlContent = `
        <h2>Welcome to SmartBench!</h2>
        <p>Click the link below to complete your profile and get started:</p>
        <a href="${deepLink}">Complete Profile</a>
        <p>This link expires in 24 hours.</p>
      `;
      break;
    case 'verification':
      deepLink = `${baseUrl}/verify-timesheet?token=${token}`;
      subject = 'Verify Worker Hours - SmartBench';
      htmlContent = `
        <h2>Timesheet Verification Required</h2>
        <p>Click the link below to verify worker hours:</p>
        <a href="${deepLink}">Verify Hours</a>
        <p>This link expires in 24 hours.</p>
      `;
      break;
    case 'password_reset':
      deepLink = `${baseUrl}/reset-password?token=${token}`;
      subject = 'Reset Your SmartBench Password';
      htmlContent = `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${deepLink}">Reset Password</a>
        <p>This link expires in 24 hours.</p>
      `;
      break;
  }

  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: htmlContent
    });

    await db('notification_logs').insert({
      type: 'email',
      recipient: email,
      status: 'delivered',
      created_at: new Date()
    });

    return { success: true };
  } catch (error) {
    await db('notification_logs').insert({
      type: 'email',
      recipient: email,
      status: 'failed',
      error: error.message,
      created_at: new Date()
    });

    throw error;
  }
}
```

### Bulk Roster Invite

**Bulk Invite Implementation:**
```typescript
async function bulkRosterInvite(req: Request, res: Response) {
  const { companyId } = req.user;
  const { invites } = req.body; // Array of { mobileNumber, firstName }

  const results = [];

  for (const invite of invites) {
    try {
      // Check for duplicate mobile number
      const existingUser = await db('users')
        .where({ mobile_number: invite.mobileNumber })
        .first();

      if (existingUser) {
        // Check if already a member
        const existingMember = await db('company_members')
          .where({ 
            user_id: existingUser.id, 
            company_id: companyId 
          })
          .first();

        if (existingMember) {
          results.push({
            mobileNumber: invite.mobileNumber,
            status: 'already_member',
            message: 'User already a member of this company'
          });
          continue;
        }
      }

      // Create or update user record
      let user;
      if (existingUser) {
        user = existingUser;
      } else {
        [user] = await db('users').insert({
          mobile_number: invite.mobileNumber,
          user_state: 'Invited',
          email: null // Will be set during onboarding
        }).returning('*');
      }

      // Create Company_Member record
      await db('company_members').insert({
        user_id: user.id,
        company_id: companyId,
        roles: ['Worker'], // Default role
        status: 'Invited'
      });

      // Generate and send magic link
      const token = generateMagicLinkToken({
        userId: user.id,
        mobileNumber: invite.mobileNumber,
        purpose: 'onboarding',
        companyId
      });

      await sendMagicLinkSMS(invite.mobileNumber, token, 'onboarding');

      results.push({
        mobileNumber: invite.mobileNumber,
        status: 'invited',
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      results.push({
        mobileNumber: invite.mobileNumber,
        status: 'error',
        message: error.message
      });
    }
  }

  res.json({ results });
}
```

### Magic Link Validation

**Token Validation Endpoint:**
```typescript
async function validateMagicLink(req: Request, res: Response) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ 
      error: 'Token required',
      userHint: 'Invalid or missing link'
    });
  }

  // Hash token to look up in database
  const tokenHash = crypto.createHash('sha256').update(token as string).digest('hex');

  const tokenRecord = await db('magic_link_tokens')
    .where({ token_hash: tokenHash })
    .where('expires_at', '>', new Date())
    .where({ used: false })
    .first();

  if (!tokenRecord) {
    return res.status(400).json({ 
      error: 'Invalid or expired token',
      userHint: 'This link has expired or already been used. Please request a new link.'
    });
  }

  // Mark token as used
  await db('magic_link_tokens')
    .where({ id: tokenRecord.id })
    .update({ used: true, used_at: new Date() });

  // Return token data for frontend
  res.json({
    valid: true,
    purpose: tokenRecord.purpose,
    userId: tokenRecord.user_id,
    targetId: tokenRecord.target_id,
    companyId: tokenRecord.company_id
  });
}
```

### Onboarding Flow with Magic Link

**Onboarding Endpoint:**
```typescript
async function completeOnboarding(req: Request, res: Response) {
  const { token, password, profileData } = req.body;

  // Validate token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenRecord = await db('magic_link_tokens')
    .where({ token_hash: tokenHash })
    .where('expires_at', '>', new Date())
    .where({ used: false })
    .first();

  if (!tokenRecord || tokenRecord.purpose !== 'onboarding') {
    return res.status(400).json({ 
      error: 'Invalid onboarding token',
      userHint: 'Please request a new invitation link'
    });
  }

  // Update user with password and profile
  const passwordHash = await hashPassword(password);
  
  await db.transaction(async (trx) => {
    // Update user
    await trx('users')
      .where({ id: tokenRecord.user_id })
      .update({
        password_hash: passwordHash,
        user_state: 'Pending_Profile',
        email: profileData.email // Optional for workers (phone-first authentication). Mobile number is required.
      });

    // Create worker profile (if applicable)
    if (profileData.trade || profileData.skills) {
      await trx('worker_profiles').insert({
        user_id: tokenRecord.user_id,
        trade: profileData.trade,
        skills: JSON.stringify(profileData.skills),
        years_of_experience: profileData.yearsOfExperience,
        home_zip_code: profileData.homeZipCode,
        max_travel_distance_miles: profileData.maxTravelDistanceMiles || 50,
        tools_equipment: profileData.toolsEquipment, // Free-form text description
        certifications: JSON.stringify(profileData.certifications || []),
        languages: JSON.stringify(profileData.languages || []),
        photo_url: profileData.photoUrl,
        // ... other profile fields
      });
    }

    // Mark token as used
    await trx('magic_link_tokens')
      .where({ id: tokenRecord.id })
      .update({ used: true, used_at: new Date() });
  });

  // Generate JWT token for immediate login
  const user = await db('users').where({ id: tokenRecord.user_id }).first();
  const accessToken = generateAccessToken(user, tokenRecord.company_id);

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      userState: user.user_state
    }
  });
}
```

### Deep Link Handling

**Frontend Deep Link Handler:**
```typescript
// Frontend: Handle magic link deep links
function handleMagicLink(url: URL) {
  const token = url.searchParams.get('token');
  const purpose = url.searchParams.get('purpose');

  if (!token) {
    // Redirect to login
    router.push('/login');
    return;
  }

  // Validate token with backend
  fetch(`/api/auth/validate-magic-link?token=${token}`)
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        switch (data.purpose) {
          case 'onboarding':
            router.push(`/onboarding?token=${token}`);
            break;
          case 'verification':
            router.push(`/verify-timesheet?token=${token}&timesheetId=${data.targetId}`);
            break;
          case 'password_reset':
            router.push(`/reset-password?token=${token}`);
            break;
        }
      } else {
        // Show error and redirect to login
        showError('This link has expired or is invalid');
        router.push('/login');
      }
    });
}
```

## Edge Cases & Failure Handling

### SMS Delivery Failures

**Scenario:** Twilio returns delivery error
- **Solution:** Automatic fallback to email (SendGrid)
- **Logging:** Log all delivery attempts and failures
- **Notification:** For critical alerts, send both SMS and email by default

### Expired Tokens

**Scenario:** User clicks magic link after 24 hours
- **Solution:** Return clear error message with option to request new link
- **UX:** Show "Link expired" message with "Resend invitation" button
- **Security:** Expired tokens cannot be reused

### Token Reuse Attempts

**Scenario:** User tries to use same token twice
- **Solution:** Mark token as `used` after first successful use
- **Validation:** Check `used` flag before processing
- **Error:** Return "Link already used" message

### Invalid Mobile Numbers

**Scenario:** Admin enters invalid mobile number in bulk invite
- **Solution:** Validate mobile number format before sending
- **Error Handling:** Skip invalid numbers and continue with valid ones
- **Feedback:** Return results array showing status for each invite

### Concurrent Invite Attempts

**Scenario:** Multiple admins invite same worker simultaneously
- **Solution:** Database unique constraint on `company_members(user_id, company_id)`
- **Error Handling:** Return "User already invited" message
- **Idempotency:** Second invite attempt is safe (no duplicate records)

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for complete table definitions, indexes, constraints, and foreign keys:
- `magic_link_tokens` - Magic link tokens for passwordless onboarding and verification (24-hour expiration)
- `notification_logs` - Logs for SMS and email notifications

### Environment Variables

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@smartbench.com
FRONTEND_URL=https://app.smartbench.com
MAGIC_LINK_EXPIRES_IN=24h
```

### Cleanup Job

**Scheduled Cleanup:** Inngest scheduled function runs daily to clean up expired tokens
```typescript
// Run daily to clean up expired tokens
async function cleanupExpiredTokens() {
  await db('magic_link_tokens')
    .where('expires_at', '<', new Date())
    .orWhere({ used: true })
    .where('used_at', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days old
    .delete();
}
```
