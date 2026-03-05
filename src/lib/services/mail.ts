import sgMail from '@sendgrid/mail';



interface SendWorkerInviteParams {
  email: string;
  inviteUrl: string;
  companyName: string;
  inviterName: string;
}

export async function sendWelcomeEmail(email: string, name: string, companyName: string) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid not configured. Mocking welcome email send.');
    console.log(`[Mock Email] Welcome To: ${email} (${name}) — Company: ${companyName}`);
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartbench.app';

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Welcome to SmartBench, ${name}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 24px; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SmartBench</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your workforce management platform</p>
        </div>

        <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p>Your company <strong>${companyName}</strong> is now set up on SmartBench. You're ready to start managing your workforce.</p>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; color: #1e293b;">Here's what you can do next:</p>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; line-height: 2;">
              <li>Invite workers to your roster</li>
              <li>List workers on the Marketplace to earn lending revenue</li>
              <li>Configure your company policies (breaks, overtime, etc.)</li>
              <li>Upload your insurance documents</li>
              <li>Connect your bank account via Stripe to receive payouts</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/dashboard" style="background-color: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Dashboard →
            </a>
          </div>

          <hr style="border: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            You're receiving this because you created an account on SmartBench.<br>
            <a href="${siteUrl}" style="color: #2563eb;">SmartBench</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    // Non-fatal — log but don't throw so signup still succeeds
    console.error('SendGrid Error sending welcome email:', error);
  }
}

export async function sendWorkerInvite({ email, inviteUrl, companyName, inviterName }: SendWorkerInviteParams) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid not configured. Mocking email send.');
    console.log(`[Mock Email] To: ${email}, Link: ${inviteUrl}`);
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `${inviterName} invited you to join ${companyName} on SmartBench`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on SmartBench.</p>
        <p>SmartBench helps you track hours, view assignments, and get paid faster.</p>
        
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accept Invitation & Join
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send invitation email');
  }
}

export async function sendVerificationSuccessEmail(email: string, name: string) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid not configured. Mocking email send.');
    console.log(`[Mock Email] Verification Success To: ${email}`);
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Your SmartBench Identity Verification is Complete`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Identity Verified!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Great news! Your identity verification has been successfully completed.</p>
        <p>You can now continue setting up your account and accessing platform features.</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid Error:', error);
  }
}

export async function sendVerificationFailedEmail(email: string, name: string, reason?: string) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid not configured. Mocking email send.');
    console.log(`[Mock Email] Verification Failed To: ${email}, Reason: ${reason}`);
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Action Required: Identity Verification Failed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Failed</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Unfortunately, we couldn't verify your identity.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please log in and try again, ensuring your documents are clear and readable.</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Retry Verification
          </a>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid Error:', error);
  }
}


export async function sendSavedSearchAlertEmail(email: string, searchName: string, matchedWorkersCount: number, isDailyDigest: boolean = false) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid not configured. Mocking email send.');
    console.log(`[Mock Email] Saved Search Alert To: ${email}, Search: ${searchName}, Matches: ${matchedWorkersCount}`);
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const alertType = isDailyDigest ? "Daily Digest" : "Instant Alert";
  const subject = `[${alertType}] SmartBench: ${matchedWorkersCount} new matches for "${searchName}"`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0f172a;">SmartBench Match Alert</h2>
        <p>Hi there,</p>
        <p>We found <strong>${matchedWorkersCount} new workers</strong> that match your saved search criteria for <strong>"${searchName}"</strong>.</p>
        
        <p>Log in to view these new matches before they get booked by someone else!</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/marketplace" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Matches Now
          </a>
        </div>
        
        <hr style="border: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">
          You are receiving this because you set an alert for this search on SmartBench.<br>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/marketplace" style="color: #2563eb;">Manage your Alert Preferences</a>
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid Error sending saved search alert:', error);
  }
}

// ─── Epic 5.7: Shift Notification Ladder ─────────────────────────────────────

/** Pre-shift reminder to worker (T-16h or T-1h) */
export async function sendShiftReminderEmail(params: {
  workerEmail: string;
  workerName: string;
  projectName: string;
  startDate: string;
  startTime?: string;
  address?: string;
  hoursUntilShift: 16 | 1;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartbench.app';
  const isNextDay = params.hoursUntilShift === 16;
  const subject = isNextDay
    ? `Reminder: Your shift starts tomorrow — ${params.projectName}`
    : `You start in 1 hour — ${params.projectName}`;

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log(`[Mock Shift Reminder] To: ${params.workerEmail}`);
    return;
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to: params.workerEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1e3a5f;padding:28px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;">${isNextDay ? 'Shift Tomorrow' : 'Shift in 1 Hour'}</h1></div><div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;"><p>Hi <strong>${params.workerName}</strong>,</p><p>Project: <strong>${params.projectName}</strong></p><p>Date: ${params.startDate}${params.startTime ? ' at ' + params.startTime : ''}</p>${params.address ? '<p>Location: ' + params.address + '</p>' : ''}<a href="${siteUrl}/dashboard/time-clock" style="background:#1e3a5f;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;margin-top:16px;">Open Time Clock</a></div></div>`,
  }).catch((err: any) => console.error('Shift reminder error:', err));
}

/** Post-shift verification reminder to supervisor (T+1h or T+3h) */
export async function sendVerifyTimesheetEmail(params: {
  supervisorEmail: string;
  supervisorName: string;
  workerName: string;
  projectName: string;
  clockIn: string;
  clockOut: string;
  hoursAfterShift: 1 | 3;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartbench.app';
  const isUrgent = params.hoursAfterShift === 3;
  const subject = isUrgent
    ? `URGENT: Timesheet auto-approves in 1 hour — ${params.workerName}`
    : `Action Required: Verify timesheet for ${params.workerName}`;

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log(`[Mock Verify Timesheet] To: ${params.supervisorEmail}`);
    return;
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to: params.supervisorEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:${isUrgent ? '#dc2626' : '#1e3a5f'};padding:28px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;">${isUrgent ? 'Urgent: Verify Now' : 'Timesheet Verification'}</h1><p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${isUrgent ? 'Auto-approval in 1 hour' : 'Review required'}</p></div><div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;"><p>Hi <strong>${params.supervisorName}</strong>,</p><p>${isUrgent ? 'This timesheet will be <strong>automatically approved in 1 hour</strong>.' : 'A timesheet is awaiting your verification.'}</p><p><strong>Worker:</strong> ${params.workerName}<br><strong>Project:</strong> ${params.projectName}<br><strong>In:</strong> ${params.clockIn}<br><strong>Out:</strong> ${params.clockOut}</p><a href="${siteUrl}/dashboard/timesheets" style="background:${isUrgent ? '#dc2626' : '#1e3a5f'};color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;margin-top:16px;">${isUrgent ? 'Verify Now' : 'Go to Timesheets'}</a></div></div>`,
  }).catch((err: any) => console.error('Timesheet verify error:', err));
}
