# Feature Blueprint: Authentication System
**Domain:** Identity
**Related Epics:** [Epic 1: Foundation & Core Infrastructure](../../../prd/epic-1.md)

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 1.3: Authentication System](../../../prd/epic-1.md#story-13-authentication-system)

## Technical Strategy (The "How")

### Password Hashing

**Implementation:**
```typescript
import bcrypt from 'bcrypt';
// or
import argon2 from 'argon2';

// Using bcrypt (recommended for MVP)
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Industry standard
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Using argon2 (more secure, slower)
async function hashPasswordArgon2(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4
  });
}
```

### JWT Token Generation

**Token Structure:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email?: string; // Optional for phone-first authentication (workers may not have email)
  mobileNumber?: string; // Primary identifier for workers (phone-first authentication)
  companyId?: string; // Current company context
  roles?: string[]; // Roles in current company context
  iat: number; // Issued at
  exp: number; // Expiration
}

function generateAccessToken(user: User, companyId?: string): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email || undefined, // Optional - may be null for workers
    mobileNumber: user.mobile_number || undefined, // Primary identifier for workers
    companyId: companyId,
    roles: user.roles, // From Company_Member record
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: '24h'
  });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' } // 7 days for refresh token
  );
}
```

### Login Endpoint

**Implementation:**
```typescript
async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;

  // 1. Find user by email OR mobile_number (phone-first authentication)
  const user = await db('users')
    .where(function() {
      this.where('email', identifier).orWhere('mobile_number', identifier);
    })
    .first();

  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid credentials',
      userHint: 'Identifier or password is incorrect'
    });
  }

  // 2. Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ 
      error: 'Invalid credentials',
      userHint: 'Identifier or password is incorrect'
    });
  }

  // 3. Get user's active company memberships
  const memberships = await db('company_members')
    .where({ user_id: user.id, status: 'Active' })
    .join('companies', 'company_members.company_id', 'companies.id')
    .select('companies.id', 'companies.name', 'company_members.roles');

  if (memberships.length === 0) {
    return res.status(403).json({ 
      error: 'No active company memberships',
      userHint: 'Please contact your company admin'
    });
  }

  // 4. Login-Time Context Resolution (Sequential Employment Model)
  let targetCompany;
  let requiresCompanySelection = false;

  if (memberships.length === 1) {
    // Single active membership: Log directly into that company
    targetCompany = memberships[0];
  } else {
    // Multiple active memberships (Edge Case): Show "Select Company" screen once after login
    requiresCompanySelection = true;
    // For now, use first company as default, but frontend should show selection screen
    targetCompany = memberships[0];
  }

  // 5. Generate tokens
  const accessToken = generateAccessToken(user, targetCompany.id);
  const refreshToken = generateRefreshToken(user.id);

  // 6. Store refresh token (optional: in database for revocation)
  await db('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // 7. Return response
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      mobileNumber: user.mobile_number,
      email: user.email, // May be null for workers
      userState: user.user_state
    },
    companies: memberships.map(m => ({
      id: m.id,
      name: m.name,
      roles: m.roles
    })),
    requiresCompanySelection // Flag for frontend to show company selection screen
  });
}
```

### Protected Route Middleware

**JWT Validation Middleware:**
```typescript
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      userHint: 'Please log in to access this resource'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        userHint: 'Please log in again'
      });
    }

    req.user = decoded as JWTPayload;
    next();
  });
}
```

### Role-Based Access Control Middleware

**RBAC Implementation:**
```typescript
function requireRole(requiredRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const companyId = req.user.companyId || req.body.company_id || req.params.companyId;

    if (!companyId) {
      return res.status(400).json({ 
        error: 'Company context required',
        userHint: 'Please select a company context'
      });
    }

    // Get user's roles in this company
    const membership = await db('company_members')
      .where({ 
        user_id: userId, 
        company_id: companyId, 
        status: 'Active' 
      })
      .first();

    if (!membership) {
      return res.status(403).json({ 
        error: 'User not a member of this company',
        userHint: 'You do not have access to this company'
      });
    }

    const userRoles = membership.roles as string[];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        userHint: `This action requires one of: ${requiredRoles.join(', ')}`
      });
    }

    req.userRoles = userRoles;
    req.companyId = companyId;
    next();
  };
}

// Usage examples:
router.get('/financial-dashboard', authenticateToken, requireRole(['Admin']), getFinancialDashboard);
router.post('/verify-hours', authenticateToken, requireRole(['Supervisor', 'Manager', 'Admin']), verifyHours);
router.get('/my-profile', authenticateToken, requireRole(['Worker', 'Admin']), getProfile);
```

### Token Refresh Endpoint

**Refresh Token Flow:**
```typescript
async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Refresh token required',
      userHint: 'Please log in again'
    });
  }

  // Verify refresh token
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid refresh token',
        userHint: 'Please log in again'
      });
    }

    const payload = decoded as { userId: string; type: string };
    
    // Check if refresh token exists in database (optional: for revocation)
    const storedToken = await db('refresh_tokens')
      .where({ user_id: payload.userId, token: refreshToken })
      .where('expires_at', '>', new Date())
      .first();

    if (!storedToken) {
      return res.status(403).json({ 
        error: 'Refresh token not found or expired',
        userHint: 'Please log in again'
      });
    }

    // Get user and generate new access token
    const user = await db('users').where({ id: payload.userId }).first();
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        userHint: 'Please contact support'
      });
    }

    // Get current company context (from previous token or default)
    const companyId = req.body.companyId; // Client sends current company context
    const accessToken = generateAccessToken(user, companyId);

    res.json({ accessToken });
  });
}
```

### Login-Time Company Context Resolution

**Phone-First Authentication & Sequential Employment Model**

The system uses **Login-Time Resolution** to determine company context. The global header company switcher has been removed per the Phone-First authentication refactor. Company context is resolved once at login time:

**Resolution Logic:**
1. **Single Active Membership:** If user has only one `Active` company membership, system logs them directly into that company context
2. **Sequential Employment:** If a worker moved from Company A to Company B:
   - Company A membership is `Inactive`
   - Company B membership is `Active`
   - System automatically logs them into Company B
3. **Multiple Active Memberships (Edge Case):** If user has multiple `Active` memberships:
   - System shows a "Select Company" screen **once** immediately after login
   - User selects company, and that context is used for the session
   - To switch companies, user must log out and log back in

**Implementation Notes:**
- Company context is determined at login and stored in the JWT token's `companyId` claim
- The login response includes a `requiresCompanySelection` flag when multiple active memberships exist
- Frontend should show company selection screen when this flag is true
- No hot-swapping of company contexts is supported - users must log out and log back in to change company context

### Password Reset Flow

**Password Reset Implementation:**
```typescript
// 1. Request password reset
async function requestPasswordReset(req: Request, res: Response) {
  const { identifier } = req.body; // Email or mobile number

  // Find user by email OR mobile_number (phone-first authentication)
  const user = await db('users')
    .where(function() {
      this.where('email', identifier).orWhere('mobile_number', identifier);
    })
    .first();

  if (!user) {
    // Don't reveal if user exists (security best practice)
    return res.json({ 
      message: 'If an account exists, a password reset link has been sent'
    });
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = await hashPassword(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await db('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: resetTokenHash,
    expires_at: expiresAt
  });

  // Send reset link via appropriate channel (phone-first: prefer SMS)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  if (user.mobile_number) {
    // Phone-first: Send via SMS
    await sendSMS(user.mobile_number, `Password Reset: ${resetLink}`);
  } else if (user.email) {
    // Fallback: Send via email
    await sendEmail(user.email, 'Password Reset', {
      resetLink,
      expiresIn: '1 hour'
    });
  }

  res.json({ 
    message: 'If an account exists, a password reset link has been sent'
  });
}

// 2. Reset password with token
async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;

  // Find valid reset token
  const resetTokens = await db('password_reset_tokens')
    .where('expires_at', '>', new Date())
    .select('*');

  let validToken = null;
  for (const resetToken of resetTokens) {
    if (await verifyPassword(token, resetToken.token_hash)) {
      validToken = resetToken;
      break;
    }
  }

  if (!validToken) {
    return res.status(400).json({ 
      error: 'Invalid or expired reset token',
      userHint: 'Please request a new password reset link'
    });
  }

  // Update password
  const newPasswordHash = await hashPassword(newPassword);
  await db('users')
    .where({ id: validToken.user_id })
    .update({ password_hash: newPasswordHash });

  // Delete used reset token
  await db('password_reset_tokens')
    .where({ id: validToken.id })
    .delete();

  // Invalidate all refresh tokens (force re-login)
  await db('refresh_tokens')
    .where({ user_id: validToken.user_id })
    .delete();

  res.json({ 
    message: 'Password reset successful. Please log in with your new password'
  });
}
```

### WebAuthn / Passkey Integration

**Fast Login Option for Returning Users**

WebAuthn (Web Authentication API) provides biometric authentication (TouchID/FaceID) as a "fast login" option for returning users. SMS Magic Links remain the primary login method, with WebAuthn serving as a convenient alternative that reduces SMS costs and improves speed for workers on job sites.

**Enrollment Flow:**
```typescript
// 1. User logs in via SMS Magic Link (primary method)
async function loginViaSMS(req: Request, res: Response) {
  const { magicLinkToken } = req.body;
  
  // Validate magic link token
  const token = await validateMagicLinkToken(magicLinkToken);
  if (!token) {
    return res.status(401).json({ error: 'Invalid or expired magic link' });
  }

  const user = await db('users').where({ id: token.user_id }).first();
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  // Check if user has WebAuthn credentials
  const hasWebAuthn = await db('webauthn_credentials')
    .where({ user_id: user.id })
    .first();

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      userState: user.user_state
    },
    promptWebAuthn: !hasWebAuthn, // Prompt enrollment if no credentials exist
  });
}

// 2. System prompts: "Enable TouchID/FaceID for faster login?"
// 3. User accepts → Begin WebAuthn registration
async function beginWebAuthnRegistration(req: Request, res: Response) {
  const userId = req.user.userId;
  
  // Generate challenge for WebAuthn registration
  const challenge = crypto.randomBytes(32);
  const challengeHash = crypto.createHash('sha256').update(challenge).digest('base64url');
  
  // Store challenge temporarily (expires in 5 minutes)
  await db('webauthn_challenges').insert({
    user_id: userId,
    challenge: challengeHash,
    purpose: 'registration',
    expires_at: new Date(Date.now() + 5 * 60 * 1000)
  });

  // Generate WebAuthn registration options
  const publicKeyCredentialCreationOptions = {
    challenge: challenge,
    rp: {
      name: "SmartBench",
      id: process.env.WEBAUTHN_RP_ID, // e.g., "smartbench.com"
    },
    user: {
      id: Buffer.from(userId),
      name: req.user.email || req.user.mobile_number, // Use email if available, else mobile_number
      displayName: req.user.email || req.user.mobile_number,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Prefer TouchID/FaceID
      userVerification: "preferred",
    },
    timeout: 60000,
    attestation: "none"
  };

  res.json({ publicKeyCredentialCreationOptions });
}

// 4. Complete WebAuthn registration
async function completeWebAuthnRegistration(req: Request, res: Response) {
  const userId = req.user.userId;
  const { credential, challenge } = req.body;

  // Verify challenge
  const storedChallenge = await db('webauthn_challenges')
    .where({ 
      user_id: userId, 
      purpose: 'registration',
      expires_at: '>', new Date()
    })
    .first();

  if (!storedChallenge) {
    return res.status(400).json({ error: 'Invalid or expired challenge' });
  }

  // Verify WebAuthn credential (using @simplewebauthn/server or similar)
  const verification = await verifyRegistrationResponse({
    credential,
    expectedChallenge: storedChallenge.challenge,
    expectedOrigin: process.env.FRONTEND_URL,
    expectedRPID: process.env.WEBAUTHN_RP_ID,
  });

  if (!verification.verified) {
    return res.status(400).json({ error: 'Credential verification failed' });
  }

  // Store WebAuthn credential
  await db('webauthn_credentials').insert({
    user_id: userId,
    credential_id: verification.credentialID,
    public_key: verification.credentialPublicKey,
    counter: verification.counter || 0,
  });

  // Clean up challenge
  await db('webauthn_challenges')
    .where({ id: storedChallenge.id })
    .delete();

  res.json({ success: true, message: 'Biometric login enabled' });
}
```

**WebAuthn Login Flow:**
```typescript
// 1. Begin WebAuthn authentication
async function beginWebAuthnLogin(req: Request, res: Response) {
  const { identifier } = req.body; // Email or mobile number

  // Find user by email OR mobile_number (phone-first authentication)
  const user = await db('users')
    .where(function() {
      this.where('email', identifier).orWhere('mobile_number', identifier);
    })
    .first();

  if (!user) {
    // Don't reveal if user exists
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // WebAuthn Implementation for Phone-First Users:
  // WebAuthn specification requires a user.id field in credential options, which is typically an email.
  // For phone-first users without email addresses, we use the mobile_number formatted as an email-like identifier.
  // Implementation approach:
  // 1. Format mobile_number as: `+{country_code}{number}@smartbench.local` (e.g., "+15551234567@smartbench.local")
  // 2. Store this formatted identifier in the WebAuthn credential's user.id field during enrollment
  // 3. Use the same formatted identifier when generating credential request options
  // 4. This ensures WebAuthn works for all users regardless of whether they have an email address
  // Note: The @smartbench.local domain is a reserved domain that will never receive real email,
  // ensuring no conflicts with actual email addresses
  const webauthnUserId = user.email || `${user.mobile_number}@smartbench.local`;

  // Get user's WebAuthn credentials
  const credentials = await db('webauthn_credentials')
    .where({ user_id: user.id })
    .select('credential_id', 'public_key', 'counter');

  if (credentials.length === 0) {
    // Fallback to SMS Magic Link
    return res.status(400).json({ 
      error: 'WebAuthn not available',
      fallback: 'sms_magic_link'
    });
  }

  // Generate challenge
  const challenge = crypto.randomBytes(32);
  const challengeHash = crypto.createHash('sha256').update(challenge).digest('base64url');

  await db('webauthn_challenges').insert({
    user_id: user.id,
    challenge: challengeHash,
    purpose: 'authentication',
    expires_at: new Date(Date.now() + 5 * 60 * 1000)
  });

  const publicKeyCredentialRequestOptions = {
    challenge: challenge,
    timeout: 60000,
    rpId: process.env.WEBAUTHN_RP_ID,
    allowCredentials: credentials.map(c => ({
      id: c.credential_id,
      type: 'public-key',
    })),
    userVerification: 'preferred',
  };

  res.json({ publicKeyCredentialRequestOptions });
}

// 2. Complete WebAuthn authentication
async function completeWebAuthnLogin(req: Request, res: Response) {
  const { identifier, credential, challenge } = req.body; // Email or mobile number

  // Find user by email OR mobile_number (phone-first authentication)
  const user = await db('users')
    .where(function() {
      this.where('email', identifier).orWhere('mobile_number', identifier);
    })
    .first();

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify challenge
  const storedChallenge = await db('webauthn_challenges')
    .where({ 
      user_id: user.id,
      purpose: 'authentication',
      expires_at: '>', new Date()
    })
    .first();

  if (!storedChallenge) {
    return res.status(400).json({ error: 'Invalid or expired challenge' });
  }

  // Get stored credential
  const storedCredential = await db('webauthn_credentials')
    .where({ 
      user_id: user.id,
      credential_id: credential.id
    })
    .first();

  if (!storedCredential) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify WebAuthn assertion
  const verification = await verifyAuthenticationResponse({
    credential,
    expectedChallenge: storedChallenge.challenge,
    expectedOrigin: process.env.FRONTEND_URL,
    expectedRPID: process.env.WEBAUTHN_RP_ID,
    authenticator: {
      credentialID: storedCredential.credential_id,
      credentialPublicKey: storedCredential.public_key,
      counter: storedCredential.counter,
    },
  });

  if (!verification.verified) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  // Update counter (prevents replay attacks)
  await db('webauthn_credentials')
    .where({ id: storedCredential.id })
    .update({ counter: verification.counter });

  // Clean up challenge
  await db('webauthn_challenges')
    .where({ id: storedChallenge.id })
    .delete();

  // Generate tokens (same as SMS login)
  const memberships = await db('company_members')
    .where({ user_id: user.id, status: 'Active' })
    .join('companies', 'company_members.company_id', 'companies.id')
    .select('companies.id', 'companies.name', 'company_members.roles');

  const primaryCompany = memberships[0];
  const accessToken = generateAccessToken(user, primaryCompany.id);
  const refreshToken = generateRefreshToken(user.id);

  await db('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      mobileNumber: user.mobile_number,
      email: user.email, // May be null for workers
      userState: user.user_state
    },
    companies: memberships.map(m => ({
      id: m.id,
      name: m.name,
      roles: m.roles
    }))
  });
}
```

**Fallback to SMS:**
- If WebAuthn fails or is unavailable, system automatically falls back to SMS Magic Link
- SMS remains the primary recovery method for account access
- Users can always use SMS Magic Link even if WebAuthn is enabled

**Security Considerations:**
1. **Challenge Storage:** Challenges expire after 5 minutes to prevent replay attacks
2. **Counter Updates:** Credential counter must be updated after each successful authentication
3. **Credential Revocation:** Users can revoke WebAuthn credentials from account settings
4. **Multi-Device Support:** Users can register multiple devices (phone, tablet, etc.)
5. **Fallback Required:** SMS Magic Link must always remain available as fallback

## Edge Cases & Failure Handling

### Token Expiration

**Scenario:** User's access token expires while using the app
- **Solution:** Client automatically calls refresh token endpoint
- **Fallback:** If refresh fails, redirect to login page
- **UX:** Show "Session expired" message with option to stay logged in

### Concurrent Logins

**Scenario:** User logs in from multiple devices
- **Solution:** Allow multiple active sessions (multiple refresh tokens)
- **Security:** Optionally implement device tracking and allow users to revoke sessions
- **Database:** Store refresh tokens with device info for management

### Password Reset Token Reuse

**Scenario:** User tries to use same reset token twice
- **Solution:** Delete reset token after successful password change
- **Validation:** Check token expiration before processing
- **Security:** Hash reset tokens in database (don't store plain tokens)

### Invalid JWT Token

**Scenario:** Token is malformed or signed with wrong secret
- **Solution:** Return 403 Forbidden with clear error message
- **Logging:** Log invalid token attempts for security monitoring
- **Rate Limiting:** Implement rate limiting on authentication endpoints

### Role Changes During Session

**Scenario:** Admin removes user's role while user has active session
- **Solution:** Check roles on every request (not just token validation)
- **Alternative:** Implement token invalidation on role changes
- **UX:** Show "Permissions changed" message and force re-login

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-identity.md](../../schema-identity.md) for complete table definitions, indexes, constraints, and foreign keys:
- `refresh_tokens` - JWT refresh token storage
- `password_reset_tokens` - Password reset token storage
- `webauthn_credentials` - WebAuthn passkey credential storage
- `webauthn_challenges` - Temporary challenge storage for WebAuthn registration/authentication

### Environment Variables

```env
JWT_SECRET=your-secret-key-here (minimum 32 characters)
JWT_REFRESH_SECRET=your-refresh-secret-key-here (minimum 32 characters)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://app.smartbench.com
WEBAUTHN_RP_ID=smartbench.com (Relying Party ID for WebAuthn)
```

### Security Considerations

1. **JWT Secret:** Must be strong, randomly generated, and stored securely
2. **Password Hashing:** Use bcrypt with salt rounds >= 12 or argon2
3. **Token Storage:** Never store JWT tokens in localStorage (use httpOnly cookies for web)
4. **HTTPS Only:** All authentication endpoints must use HTTPS
5. **Rate Limiting:** Implement rate limiting on login and password reset endpoints
6. **Token Rotation:** Consider implementing refresh token rotation for enhanced security
