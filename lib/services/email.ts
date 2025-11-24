import { Resend } from 'resend';
import { getConfig } from '../config/config';
import { getEnvConfig } from '../config/env';
import { formatDateTime } from '@/utils/dateUtils';

const env = getEnvConfig();
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendAnnouncementEmailParams {
  title: string;
  description: string;
  category: string;
  recipientEmails: string[];
  expiryDate?: string | null;
  scheduledAt?: string | null;
}

export async function sendAnnouncementEmail({
  title,
  description,
  category,
  recipientEmails,
  expiryDate,
  scheduledAt,
}: SendAnnouncementEmailParams): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!resend) {
      console.warn('Resend API key is not configured - email functionality disabled');
      return {
        success: false,
        error: 'Email service is not configured. Please set RESEND_API_KEY.',
      };
    }

    const cfg = getConfig();
    const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (recipientEmails.length === 0) {
      return { success: false, error: 'No recipients specified' };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>New Announcement: ${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📢 New Announcement</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0; font-size: 22px;">${title}</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 15px 0; color: #555; font-size: 16px; white-space: pre-wrap;">${description}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #667eea;">Category:</td>
                  <td style="padding: 8px 0; color: #555; text-transform: capitalize;">${category}</td>
                </tr>
                ${expiryDate ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #667eea;">Expiry Date:</td>
                  <td style="padding: 8px 0; color: #555;">${formatDateTime(expiryDate, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }, 'en-US', 'Not specified')}</td>
                </tr>
                ` : ''}
                ${scheduledAt ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #667eea;">Scheduled For:</td>
                  <td style="padding: 8px 0; color: #555;">${formatDateTime(scheduledAt, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }, 'en-US', 'Not specified')}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${cfg.frontendUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View All Announcements</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated notification from the SST Announcement System.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
New Announcement: ${title}

${description}

Category: ${category}
${expiryDate ? `Expiry Date: ${formatDateTime(expiryDate, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}, 'en-US', 'Not specified')}` : ''}
${scheduledAt ? `Scheduled For: ${formatDateTime(scheduledAt, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}, 'en-US', 'Not specified')}` : ''}

View all announcements: ${cfg.frontendUrl}

This is an automated notification from the SST Announcement System.
    `.trim();

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmails,
      subject: `📢 New Announcement: ${title}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      message: `Email sent successfully to ${recipientEmails.length} recipient(s)`,
    };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
