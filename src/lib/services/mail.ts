import sgMail from '@sendgrid/mail';



interface SendWorkerInviteParams {
  email: string;
  inviteUrl: string;
  companyName: string;
  inviterName: string;
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

