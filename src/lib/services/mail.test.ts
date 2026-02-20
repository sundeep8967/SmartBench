import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { sendWorkerInvite, sendVerificationSuccessEmail, sendVerificationFailedEmail } from './mail';
import sgMail from '@sendgrid/mail';

vi.mock('@sendgrid/mail', () => ({
    default: {
        setApiKey: vi.fn(),
        send: vi.fn(),
    },
}));

describe('mail service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('sendWorkerInvite', () => {
        it('should log a mock email if SendGrid is not configured', async () => {
            // Arrange
            delete process.env.SENDGRID_API_KEY;
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            // Act
            await sendWorkerInvite({
                email: 'test@example.com',
                inviteUrl: 'http://example.com/invite',
                companyName: 'Test Company',
                inviterName: 'John Doe',
            });

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith('SendGrid not configured. Mocking email send.');
            expect(consoleLogSpy).toHaveBeenCalledWith('[Mock Email] To: test@example.com, Link: http://example.com/invite');
            expect(sgMail.send).not.toHaveBeenCalled();

            // Cleanup
            consoleWarnSpy.mockRestore();
            consoleLogSpy.mockRestore();
        });

        it('should call sgMail.send when SendGrid is configured', async () => {
            // Arrange
            process.env.SENDGRID_API_KEY = 'test-api-key';
            process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
            (sgMail.send as any).mockResolvedValue([{ statusCode: 202 }]);

            // Act
            await sendWorkerInvite({
                email: 'test@example.com',
                inviteUrl: 'http://example.com/invite',
                companyName: 'Test Company',
                inviterName: 'John Doe',
            });

            // Assert
            expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
            expect(sgMail.send).toHaveBeenCalled();
            const callArg = (sgMail.send as any).mock.calls[0][0];
            expect(callArg.to).toBe('test@example.com');
            expect(callArg.subject).toContain('John Doe invited you to join Test Company');
        });
    });

    describe('sendVerificationSuccessEmail', () => {
        it('should call sgMail.send when configured', async () => {
            // Arrange
            process.env.SENDGRID_API_KEY = 'test-api-key';
            process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
            (sgMail.send as any).mockResolvedValue([{ statusCode: 202 }]);

            // Act
            await sendVerificationSuccessEmail('test@example.com', 'Jane Doe');

            // Assert
            expect(sgMail.send).toHaveBeenCalled();
            const callArg = (sgMail.send as any).mock.calls[0][0];
            expect(callArg.to).toBe('test@example.com');
            expect(callArg.subject).toContain('Your SmartBench Identity Verification is Complete');
        });
    });

    describe('sendVerificationFailedEmail', () => {
        it('should call sgMail.send with reason when configured', async () => {
            // Arrange
            process.env.SENDGRID_API_KEY = 'test-api-key';
            process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
            (sgMail.send as any).mockResolvedValue([{ statusCode: 202 }]);

            // Act
            await sendVerificationFailedEmail('test@example.com', 'Jane Doe', 'Blurry ID');

            // Assert
            expect(sgMail.send).toHaveBeenCalled();
            const callArg = (sgMail.send as any).mock.calls[0][0];
            expect(callArg.to).toBe('test@example.com');
            expect(callArg.subject).toContain('Action Required: Identity Verification Failed');
            expect(callArg.html).toContain('Blurry ID');
        });
    });
});
