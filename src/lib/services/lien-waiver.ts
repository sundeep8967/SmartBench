/**
 * Story 6.8: Lien Waivers
 *
 * Generates a Partial Conditional Lien Waiver PDF (via HTML→PDF through
 * Supabase Edge Function or plain HTML base64 attachment) and emails it
 * to the Borrowing company admin when a payout is released.
 *
 * Flow:
 *   1. Called by payout.ts immediately after Stripe Transfer succeeds
 *   2. Builds the waiver HTML document
 *   3. Stores the HTML as a .pdf-placeholder in Supabase Storage (lien-waivers bucket)
 *   4. Sends email to Borrowing Admin with the waiver as an HTML attachment
 */

import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

export interface LienWaiverParams {
    timeEntryId: string;
    bookingId: string;
    transferId: string;
    payoutAmountCents: number;
    // Lender (worker supplier)
    lenderCompanyName: string;
    lenderCompanyAddress?: string;
    lenderRepName?: string;
    // Borrower (work recipient)
    borrowerCompanyId: string;
    borrowerCompanyName: string;
    // Worker
    workerName: string;
    // Dates
    shiftDate: string;      // ISO date
    clockIn: string;        // ISO timestamp
    clockOut: string;       // ISO timestamp
    hoursWorked: number;
}

// ── Generate Waiver HTML ──────────────────────────────────────────────────────

function generateWaiverHtml(p: LienWaiverParams): string {
    const issued = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const shiftFmt = new Date(p.shiftDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const amtStr = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
    }).format(p.payoutAmountCents / 100);
    const inFmt = new Date(p.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const outFmt = new Date(p.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Partial Conditional Lien Waiver — SmartBench</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; font-size: 11pt; padding: 48px; max-width: 760px; margin: 0 auto; }
    h1 { font-size: 16pt; text-align: center; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 8px; }
    .subtitle { text-align: center; font-size: 10pt; color: #444; margin-bottom: 32px; }
    .section-header { font-size: 10pt; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; color: #555; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    td { padding: 5px 8px; font-size: 10.5pt; vertical-align: top; }
    td:first-child { font-weight: bold; width: 200px; color: #333; }
    .amount { font-size: 14pt; font-weight: bold; color: #1a540b; }
    .legal { font-size: 9pt; line-height: 1.65; color: #333; margin: 24px 0; padding: 16px; border: 1px solid #ccc; background: #fafafa; }
    .sig-block { margin-top: 40px; display: flex; gap: 64px; }
    .sig-line { border-top: 1px solid #333; width: 260px; padding-top: 4px; font-size: 9pt; color: #444; }
    .footer { margin-top: 48px; font-size: 8pt; text-align: center; color: #999; border-top: 1px solid #e0e0e0; padding-top: 12px; }
    .badge { display: inline-block; background: #1e3a5f; color: white; padding: 2px 10px; border-radius: 4px; font-size: 9pt; font-family: Arial, sans-serif; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>Partial Conditional Lien Waiver</h1>
  <p class="subtitle">Upon Receipt — SmartBench Labor Marketplace</p>
  <p style="text-align:center;"><span class="badge">Reference: SB-${p.bookingId.slice(-8).toUpperCase()}</span></p>

  <p class="section-header">Parties</p>
  <table>
    <tr><td>Claimant (Lender):</td><td>${p.lenderCompanyName}${p.lenderCompanyAddress ? '<br><span style="color:#555;font-size:9.5pt;">' + p.lenderCompanyAddress + '</span>' : ''}</td></tr>
    <tr><td>Owner / GC (Borrower):</td><td>${p.borrowerCompanyName}</td></tr>
    <tr><td>Worker:</td><td>${p.workerName}</td></tr>
  </table>

  <p class="section-header">Work Details</p>
  <table>
    <tr><td>Booking Reference:</td><td>${p.bookingId}</td></tr>
    <tr><td>Shift Date:</td><td>${shiftFmt}</td></tr>
    <tr><td>Time In / Out:</td><td>${inFmt} – ${outFmt}</td></tr>
    <tr><td>Hours Worked:</td><td>${p.hoursWorked.toFixed(2)} hrs</td></tr>
    <tr><td>Stripe Transfer:</td><td>${p.transferId}</td></tr>
  </table>

  <p class="section-header">Amount</p>
  <table>
    <tr><td>Payout Amount:</td><td class="amount">${amtStr}</td></tr>
    <tr><td>Issued Date:</td><td>${issued}</td></tr>
  </table>

  <div class="legal">
    <strong>CONDITIONAL WAIVER AND RELEASE ON PAYMENT</strong><br /><br />
    Upon receipt by the undersigned of a check from <strong>${p.borrowerCompanyName}</strong> payable to
    <strong>${p.lenderCompanyName}</strong> in the sum of <strong>${amtStr}</strong> and when the check has been properly
    endorsed and has been paid by the bank upon which it is drawn, this document shall become effective to release any
    mechanic's lien, stop payment notice, or bond claim the undersigned has on the job of ${p.borrowerCompanyName}.<br /><br />
    This release covers a progress payment for labor and/or services through the date of <strong>${shiftFmt}</strong>
    only and does not cover any retention or items, disputed items, or extras for which the claimant has not received payment.<br /><br />
    The undersigned warrants that the undersigned either has already paid or will use the money they receive from this
    progress payment promptly to pay in full all workers engaged in the work described above.
  </div>

  <div class="sig-block">
    <div>
      <div class="sig-line">
        Authorized Signature — ${p.lenderCompanyName}
      </div>
      <div style="margin-top:8px;font-size:9pt;color:#555;">
        ${p.lenderRepName || 'Authorized Representative'}<br />
        Date: ${issued}
      </div>
    </div>
  </div>

  <div class="footer">
    Generated by SmartBench · ${issued} · Time Entry ${p.timeEntryId}<br />
    This document is for record-keeping purposes. Consult legal counsel for enforceability in your jurisdiction.
  </div>
</body>
</html>`;
}

// ── Upload to Supabase Storage ────────────────────────────────────────────────

async function uploadWaiverToStorage(
    supabaseAdmin: any,
    html: string,
    timeEntryId: string,
): Promise<string | null> {
    try {
        const path = `waivers/${new Date().getFullYear()}/${timeEntryId}.html`;
        const { error } = await supabaseAdmin.storage
            .from('lien-waivers')
            .upload(path, Buffer.from(html, 'utf-8'), {
                contentType: 'text/html',
                upsert: true,
            });
        if (error) {
            console.warn('[lien-waiver] Storage upload failed (non-fatal):', error.message);
            return null;
        }
        const { data } = supabaseAdmin.storage.from('lien-waivers').getPublicUrl(path);
        return data?.publicUrl || null;
    } catch (e: any) {
        console.warn('[lien-waiver] Storage exception (non-fatal):', e.message);
        return null;
    }
}

// ── Send Email ────────────────────────────────────────────────────────────────

async function sendLienWaiverEmail(
    borrowerAdminEmail: string,
    borrowerAdminName: string,
    p: LienWaiverParams,
    html: string,
): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        console.log(`[Mock Lien Waiver Email] To: ${borrowerAdminEmail} — Booking: ${p.bookingId}`);
        return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartbench.app';
    const amtStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.payoutAmountCents / 100);
    const shiftFmt = new Date(p.shiftDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    await sgMail.send({
        to: borrowerAdminEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `Partial Lien Waiver — ${p.lenderCompanyName} · Booking #${p.bookingId.slice(-8).toUpperCase()}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 28px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Partial Lien Waiver</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">SmartBench Labor Marketplace</p>
  </div>
  <div style="padding: 28px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px; background: #f8fafc;">
    <p>Hi <strong>${borrowerAdminName}</strong>,</p>
    <p>A payout has been released for labor provided by <strong>${p.lenderCompanyName}</strong>. The attached Partial Conditional Lien Waiver documents this payment for your records.</p>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Booking Ref</td><td style="font-weight: bold;">SB-${p.bookingId.slice(-8).toUpperCase()}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Lender</td><td>${p.lenderCompanyName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Worker</td><td>${p.workerName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Shift Date</td><td>${shiftFmt}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Hours</td><td>${p.hoursWorked.toFixed(2)} hrs</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid</td><td style="font-weight: bold; color: #15803d; font-size: 15px;">${amtStr}</td></tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #64748b;">The lien waiver is attached to this email as an HTML file. Please retain it for your financial and legal records.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${siteUrl}/dashboard/financials" style="background: #1e3a5f; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">View Financials →</a>
    </div>

    <hr style="border: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
      SmartBench · Automated document · ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
    </p>
  </div>
</div>`,
        attachments: [
            {
                content: Buffer.from(html, 'utf-8').toString('base64'),
                filename: `lien-waiver-${p.bookingId.slice(-8)}-${p.shiftDate}.html`,
                type: 'text/html',
                disposition: 'attachment',
            },
        ],
    }).catch((err: any) => {
        console.error('[lien-waiver] SendGrid error (non-fatal):', err?.response?.body || err.message);
    });
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * Called by payout.ts after Stripe transfer succeeds.
 * All errors are non-fatal — we log them but never throw.
 */
export async function generateAndSendLienWaiver(p: LienWaiverParams): Promise<void> {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    try {
        // 1. Build the HTML waiver document
        const html = generateWaiverHtml(p);

        // 2. Find borrower admin email
        const { data: borrowerAdmins } = await supabaseAdmin
            .from('company_members')
            .select('user_id, users!inner(email, full_name)')
            .eq('company_id', p.borrowerCompanyId)
            .eq('status', 'Active')
            .contains('roles', ['Admin'])
            .limit(1);

        const borrowerAdmin = (borrowerAdmins?.[0] as any);
        const borrowerEmail: string | null = borrowerAdmin?.users?.email || null;
        const borrowerName: string = borrowerAdmin?.users?.full_name || 'Admin';

        // 3. Upload to Supabase Storage (audit trail)
        await uploadWaiverToStorage(supabaseAdmin, html, p.timeEntryId);

        // 4. Email to borrower admin (skip silently if no email found)
        if (borrowerEmail) {
            await sendLienWaiverEmail(borrowerEmail, borrowerName, p, html);
            console.log(`✅ Lien waiver sent to ${borrowerEmail} — Booking ${p.bookingId}`);
        } else {
            console.warn(`[lien-waiver] No borrower admin email found for company ${p.borrowerCompanyId} — skipping email`);
        }

    } catch (err: any) {
        // Completely non-fatal — payout already succeeded
        console.error('[lien-waiver] Error generating/sending waiver (non-fatal):', err.message);
    }
}
