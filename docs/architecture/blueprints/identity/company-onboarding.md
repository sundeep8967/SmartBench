# Feature Blueprint: Company Onboarding
**Domain:** Identity
**Related Epics:** [Epic 2: Worker Onboarding & Profile Management](../../../prd/epic-2.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 2.1: Company Onboarding Wizard](../../../prd/epic-2.md#story-21-company-onboarding-wizard)

## Technical Strategy (The "How")

### Sequential Employment Validation

**Reference:** See [Unified User Model Blueprint](./unified-user-model.md#sequential-employment-validation) for the `validateSequentialEmployment()` function implementation.

**Usage:** All company membership activations must validate sequential employment before creating or updating `company_members` records with `status='Active'`.

### Onboarding State Management

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for the `onboarding_sessions` table definition.

### Step 1: Company Info Collection

**Implementation:**
```typescript
interface CompanyInfo {
  ein: string;
  businessName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

async function saveCompanyInfo(req: Request, res: Response) {
  const { companyInfo } = req.body;
  const userId = req.user.userId;

  // Validate EIN format (basic validation)
  if (!/^\d{2}-?\d{7}$/.test(companyInfo.ein)) {
    return res.status(400).json({ 
      error: 'Invalid EIN format',
      userHint: 'EIN must be in format XX-XXXXXXX'
    });
  }

  // Check for duplicate EIN
  const existingCompany = await db('companies')
    .where({ ein: companyInfo.ein })
    .first();

  if (existingCompany) {
    return res.status(400).json({ 
      error: 'Company with this EIN already exists',
      userHint: 'A company with this EIN is already registered'
    });
  }

  // Create or update onboarding session
  let session = await db('onboarding_sessions')
    .where({ user_id: userId })
    .first();

  if (!session) {
    // Create new session
    [session] = await db('onboarding_sessions').insert({
      user_id: userId,
      current_step: 1,
      step_data: JSON.stringify({ step1: companyInfo }),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }).returning('*');
  } else {
    // Update existing session
    const stepData = JSON.parse(session.step_data);
    stepData.step1 = companyInfo;
    
    await db('onboarding_sessions')
      .where({ id: session.id })
      .update({
        current_step: 1,
        step_data: JSON.stringify(stepData),
        updated_at: new Date()
      });
  }

  res.json({ 
    success: true,
    sessionId: session.id,
    currentStep: 1,
    nextStep: 2
  });
}
```

### Step 2: KYB Verification (Stripe Identity)

**Stripe Identity Integration:**
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function initiateKYBVerification(req: Request, res: Response) {
  const { sessionId } = req.body;
  const userId = req.user.userId;

  const session = await db('onboarding_sessions')
    .where({ id: sessionId, user_id: userId })
    .first();

  if (!session) {
    return res.status(404).json({ 
      error: 'Onboarding session not found',
      userHint: 'Please start onboarding again'
    });
  }

  const stepData = JSON.parse(session.step_data);
  const companyInfo = stepData.step1;

  // Create Stripe Identity Verification Session
  const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'business',
    metadata: {
      company_ein: companyInfo.ein,
      company_name: companyInfo.businessName
    },
    options: {
      business: {
        representative: {
          email: req.user.email
        }
      }
    }
  });

  // Store verification session ID
  stepData.step2 = {
    stripeVerificationSessionId: verificationSession.id,
    status: 'pending'
  };

  await db('onboarding_sessions')
    .where({ id: sessionId })
    .update({
      current_step: 2,
      step_data: JSON.stringify(stepData),
      updated_at: new Date()
    });

  res.json({
    success: true,
    verificationUrl: verificationSession.url, // Frontend redirects user here
    verificationSessionId: verificationSession.id
  });
}

// Webhook handler for Stripe Identity verification status
async function handleStripeIdentityWebhook(req: Request, res: Response) {
  const event = req.body;

  if (event.type === 'identity.verification_session.verified') {
    const verificationSession = event.data.object;
    
    // Find onboarding session by verification session ID
    const sessions = await db('onboarding_sessions')
      .select('*');

    for (const session of sessions) {
      const stepData = JSON.parse(session.step_data);
      if (stepData.step2?.stripeVerificationSessionId === verificationSession.id) {
        stepData.step2.status = 'verified';
        stepData.step2.verifiedAt = new Date();

        await db('onboarding_sessions')
          .where({ id: session.id })
          .update({
            step_data: JSON.stringify(stepData),
            current_step: 3, // Move to next step
            updated_at: new Date()
          });

        // Notify user that verification is complete
        await sendNotification(session.user_id, {
          type: 'kyb_verified',
          message: 'Business verification complete! Continue with profile setup.'
        });
      }
    }
  }

  res.json({ received: true });
}
```

### Step 3: User Profile Creation

**Solopreneur vs Multi-Employee Flow:**
```typescript
async function saveUserProfile(req: Request, res: Response) {
  const { sessionId, userType, profileData } = req.body;
  const userId = req.user.userId;

  const session = await db('onboarding_sessions')
    .where({ id: sessionId, user_id: userId })
    .first();

  if (!session) {
    return res.status(404).json({ 
      error: 'Onboarding session not found',
      userHint: 'Please start onboarding again'
    });
  }

  const stepData = JSON.parse(session.step_data);

  if (userType === 'solopreneur') {
    // Solopreneur: Create company and assign all roles
    // Validate sequential employment before creating company
    const employmentValidation = await validateSequentialEmployment(userId, null);
    
    if (!employmentValidation.allowed) {
      return res.status(400).json({
        error: 'Cannot create company',
        userHint: `You are currently an active member of ${employmentValidation.existingActiveMembership?.companyName}. Please deactivate your membership there first, or choose to deactivate it and join this new company.`,
        requiresUserChoice: true,
        existingMembership: employmentValidation.existingActiveMembership
      });
    }

    await db.transaction(async (trx) => {
      // Create company
      const [company] = await trx('companies').insert({
        ein: stepData.step1.ein,
        name: stepData.step1.businessName,
        address: JSON.stringify(stepData.step1.address),
        default_currency: 'USD'
      }).returning('*');

      // Validate again within transaction (defense in depth)
      const validationInTx = await validateSequentialEmployment(userId, company.id);
      if (!validationInTx.allowed) {
        throw new Error(`Concurrent employment detected: User already active at ${validationInTx.existingActiveMembership?.companyName}`);
      }

      // Create company member with all roles
      await trx('company_members').insert({
        user_id: userId,
        company_id: company.id,
        roles: ['Worker', 'Supervisor', 'Admin'], // Auto-assign all roles
        status: 'Active'
      });


      // Update user state
      await trx('users')
        .where({ id: userId })
        .update({ user_state: 'Pending_Profile' });

      // Update onboarding session
      stepData.step3 = {
        userType: 'solopreneur',
        companyId: company.id,
        profileData
      };

      await trx('onboarding_sessions')
        .where({ id: sessionId })
        .update({
          current_step: 3,
          step_data: JSON.stringify(stepData),
          company_id: company.id,
          updated_at: new Date()
        });
    });

    res.json({
      success: true,
      userType: 'solopreneur',
      nextStep: 4,
      redirectTo: '/my-profile' // Direct to profile completion
    });
  } else {
    // Multi-employee: Just save profile data, company creation happens later
    stepData.step3 = {
      userType: 'multi_employee',
      profileData
    };

    await db('onboarding_sessions')
      .where({ id: sessionId })
      .update({
        current_step: 3,
        step_data: JSON.stringify(stepData),
        updated_at: new Date()
      });

    res.json({
      success: true,
      userType: 'multi_employee',
      nextStep: 4
    });
  }
}
```

### Step 4: Complete Profile (Optional)

**Final Step:**
```typescript
async function completeOnboarding(req: Request, res: Response) {
  const { sessionId, optionalCompanyDetails } = req.body;
  const userId = req.user.userId;

  const session = await db('onboarding_sessions')
    .where({ id: sessionId, user_id: userId })
    .first();

  if (!session) {
    return res.status(404).json({ 
      error: 'Onboarding session not found',
      userHint: 'Please start onboarding again'
    });
  }

  const stepData = JSON.parse(session.step_data);

  // Update company with optional details if provided
  if (session.company_id && optionalCompanyDetails) {
    await db('companies')
      .where({ id: session.company_id })
      .update({
        ...optionalCompanyDetails,
        updated_at: new Date()
      });
  }

  // Mark onboarding as complete
  await db('onboarding_sessions')
    .where({ id: sessionId })
    .update({
      current_step: 4,
      step_data: JSON.stringify({ ...stepData, step4: optionalCompanyDetails }),
      completed: true,
      updated_at: new Date()
    });

  res.json({
    success: true,
    onboardingComplete: true,
    redirectTo: session.stepData.step3?.userType === 'solopreneur' 
      ? '/my-profile' 
      : '/dashboard'
  });
}
```

### Resume Onboarding

**Resume Flow:**
```typescript
async function getOnboardingStatus(req: Request, res: Response) {
  const userId = req.user.userId;

  const session = await db('onboarding_sessions')
    .where({ user_id: userId })
    .where('expires_at', '>', new Date())
    .where({ completed: false })
    .orderBy('updated_at', 'desc')
    .first();

  if (!session) {
    return res.json({ 
      hasActiveSession: false,
      message: 'No active onboarding session'
    });
  }

  const stepData = JSON.parse(session.step_data);

  res.json({
    hasActiveSession: true,
    sessionId: session.id,
    currentStep: session.current_step,
    stepData: {
      step1: stepData.step1,
      step2: stepData.step2,
      step3: stepData.step3,
      step4: stepData.step4
    },
    companyId: session.company_id
  });
}
```

### Frontend Progress Indicator

**Progress Component:**
```typescript
// Frontend: Progress indicator component
function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: 'Company Info' },
    { number: 2, title: 'KYB Verification' },
    { number: 3, title: 'User Profile' },
    { number: 4, title: 'Complete' }
  ];

  return (
    <div className="onboarding-progress">
      {steps.map((step, index) => (
        <div key={step.number} className={`step ${step.number <= currentStep ? 'active' : ''}`}>
          <div className="step-number">{step.number}</div>
          <div className="step-title">{step.title}</div>
          {index < steps.length - 1 && <div className="step-connector" />}
        </div>
      ))}
    </div>
  );
}
```

## Edge Cases & Failure Handling

### Incomplete Onboarding

**Scenario:** User starts onboarding but doesn't complete it
- **Solution:** Onboarding sessions expire after 30 days
- **Resume:** User can resume from last completed step
- **Notification:** Send reminder emails after 7 days of inactivity

### KYB Verification Failure

**Scenario:** Stripe Identity verification fails or is rejected

**KYB Verification Retry Policy:**
- **Retry Limits:** Maximum 3 verification attempts per onboarding session
- **Retry Window:** 30 days from first verification attempt (aligned with onboarding session expiration)
- **Attempt Tracking:** System tracks verification attempts in `onboarding_sessions.step_data` (step2.attempt_count, step2.attempts array with timestamps and failure reasons)
- **After 3 Failures:**
  - Onboarding session is locked for KYB verification
  - User cannot proceed to next step (Step 3: User Profile Creation)
  - System displays message: "KYB verification failed after 3 attempts. Please contact support for assistance."
  - User must contact support for manual review
  - Support can reset verification attempts or escalate to Stripe Identity support

**Escalation Process:**
1. After 3rd failure, system automatically sends notification to support team with:
   - User ID and company information
   - Verification session ID from Stripe
   - Failure reasons from all 3 attempts
   - Timestamps of each attempt
2. Support reviews verification failure reasons from Stripe Identity dashboard
3. Support can take one of the following actions:
   - **Reset Attempts:** Support can reset the attempt counter, allowing user to retry (maximum 1 reset per onboarding session)
   - **Provide Guidance:** Support provides specific guidance based on Stripe failure reasons (e.g., document quality issues, information mismatch)
   - **Escalate to Stripe:** Support escalates to Stripe Identity support for complex cases or suspected Stripe-side issues
4. All escalation actions are logged in `audit_log` with:
   - `action_type = 'KYB_Verification_Escalation'`
   - `target_entity = 'Onboarding_Session'`
   - `target_id = onboarding_session_id`
   - `metadata` includes: `admin_id`, `escalation_action`, `stripe_verification_session_id`, `failure_reasons`

**Error Handling:**
- **First/Second Failure:** Show clear error message with retry option: "KYB verification failed. Please review your information and try again. Attempts remaining: [X]"
- **Third Failure:** Show escalation message: "KYB verification failed after 3 attempts. Please contact support for assistance." Display support contact information and ticket creation link
- **Session Locked:** If session is locked, prevent user from accessing verification step until support resolves the issue

**Support Contact:**
- Support email: support@smartbench.com
- Support ticket creation link provided in error message
- Support response time: Within 24 hours for KYB verification issues

### Duplicate EIN

**Scenario:** User tries to register with EIN that already exists
- **Solution:** Check EIN uniqueness before creating company
- **Error:** Return clear error message
- **Alternative:** Allow user to join existing company if they have access

### Session Expiration

**Scenario:** Onboarding session expires before completion
- **Solution:** Check expiration date on resume
- **Handling:** If expired, allow user to start fresh or extend session
- **Data:** Preserve completed steps if user wants to continue

### Concurrent Onboarding

**Scenario:** User opens onboarding in multiple browser tabs
- **Solution:** Use session-based locking or optimistic locking
- **Handling:** Last write wins, or merge step data intelligently
- **UX:** Show warning if another tab is active

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for complete table definitions, indexes, constraints, and foreign keys:
- `onboarding_sessions` - Tracks multi-step onboarding wizard progress (expires after 30 days)
- `users` - User record creation/update
- `companies` - Company record creation
- `company_members` - Membership record with roles

### Cleanup Job

**Scheduled Cleanup:**
```typescript
// Run daily to clean up expired onboarding sessions
async function cleanupExpiredOnboardingSessions() {
  await db('onboarding_sessions')
    .where('expires_at', '<', new Date())
    .where({ completed: false })
    .delete();
}
```
