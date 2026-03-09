import twilio from "twilio";

// Initialize Twilio client only if credentials exist
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, body: string) {
    if (!client || !fromPhone) {
        console.warn('Twilio not configured. Mocking SMS send.');
        console.log(`[Mock SMS] To: ${to} - Body: "${body}"`);
        return;
    }

    try {
        await client.messages.create({
            body,
            from: fromPhone,
            to,
        });
    } catch (error: any) {
        console.error('Twilio Error sending SMS:', error);
    }
}

// ─── Epic 5.7: Shift Notification Ladder (SMS) ──────────────────────────────

/** Pre-shift reminder to worker (T-16h or T-1h) */
export async function sendShiftReminderSMS(params: {
    workerPhone?: string;
    workerName: string;
    projectName: string;
    startDate: string;
    startTime?: string;
    hoursUntilShift: 16 | 1;
}) {
    if (!params.workerPhone) return;

    const isNextDay = params.hoursUntilShift === 16;
    const body = isNextDay
        ? `Hi ${params.workerName}, reminder that your shift at ${params.projectName} starts tomorrow (${params.startDate}).`
        : `Hi ${params.workerName}, your shift at ${params.projectName} starts in 1 hour!`;

    await sendSMS(params.workerPhone, body);
}

/** Post-shift verification reminder to supervisor (T+1h or T+3h) */
export async function sendVerifyTimesheetSMS(params: {
    supervisorPhone?: string;
    supervisorName: string;
    workerName: string;
    projectName: string;
    hoursAfterShift: 1 | 3;
}) {
    if (!params.supervisorPhone) return;

    const isUrgent = params.hoursAfterShift === 3;
    const body = isUrgent
        ? `URGENT: ${params.supervisorName}, timesheet for ${params.workerName} at ${params.projectName} auto-approves in 1 hour. Please verify now.`
        : `Action Required: ${params.supervisorName}, please verify the timesheet for ${params.workerName} at ${params.projectName}.`;

    await sendSMS(params.supervisorPhone, body);
}
