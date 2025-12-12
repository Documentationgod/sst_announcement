import { NextRequest, NextResponse } from 'next/server';
import { getDb, getPool } from '@/lib/config/db';
import { announcements, announcementSettings, announcementTargets, users } from '@/lib/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendAnnouncementEmail } from '@/lib/services/email';
import { extractIntakeCodeFromEmail } from '@/utils/studentYear';


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isLocalDev = process.env.NODE_ENV === 'development';
      if (!isLocalDev) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const db = getDb();
    const pool = getPool();
    const now = new Date();

    console.log(`[Scheduler] Running at ${now.toISOString()}`);

    const reminderResults = await processReminderEmails(db, pool, now);

    const summary = {
      timestamp: now.toISOString(),
      reminders: {
        processed: reminderResults.processed,
        sent: reminderResults.sent,
        failed: reminderResults.failed,
        errors: reminderResults.errors,
      },
    };

    console.log(`[Scheduler] Completed:`, JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Scheduler completed successfully',
      ...summary,
    });
  } catch (error) {
    console.error('[Scheduler] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


async function processReminderEmails(
  db: ReturnType<typeof getDb>,
  pool: ReturnType<typeof getPool>,
  now: Date
) {
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {

    const query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.category,
        a.is_active,
        a.status,
        s.reminder_time,
        s.send_email,
        s.reminder_sent,
        t.target_year
      FROM announcements a
      INNER JOIN announcement_settings s ON a.id = s.announcement_id
      LEFT JOIN announcement_targets t ON a.id = t.announcement_id
      WHERE 
        s.reminder_time IS NOT NULL
        AND s.reminder_time <= $1
        AND s.reminder_sent = false
        AND s.send_email = true
        AND a.is_active = true
        AND a.status != 'expired'
      ORDER BY s.reminder_time ASC
    `;

    const reminderRows = await pool.query(query, [now.toISOString()]);

    const announcementMap = new Map<number, {
      id: number;
      title: string;
      description: string;
      category: string;
      reminderTime: Date;
      targetYears: number[];
    }>();

    for (const row of reminderRows.rows) {
      const announcementId = row.id;
      
      if (!announcementMap.has(announcementId)) {
        announcementMap.set(announcementId, {
          id: announcementId,
          title: row.title,
          description: row.description,
          category: row.category,
          reminderTime: new Date(row.reminder_time),
          targetYears: [],
        });
      }

      if (row.target_year !== null) {
        const announcement = announcementMap.get(announcementId)!;
        if (!announcement.targetYears.includes(row.target_year)) {
          announcement.targetYears.push(row.target_year);
        }
      }
    }

    console.log(`[Scheduler] Found ${announcementMap.size} announcements needing reminder emails`);

    for (const [announcementId, announcement] of announcementMap) {
      results.processed++;

      try {
        const recipientEmails = await resolveRecipientEmails(
          announcement.targetYears.length > 0 ? announcement.targetYears : null
        );

        if (recipientEmails.length === 0) {
          console.warn(`[Scheduler] No recipients found for announcement ${announcementId}`);
          await db
            .update(announcementSettings)
            .set({ reminderSent: true })
            .where(eq(announcementSettings.announcementId, announcementId));
          continue;
        }

        const emailResult = await sendReminderEmail({
          title: announcement.title,
          description: announcement.description,
          category: announcement.category,
          recipientEmails,
          reminderTime: announcement.reminderTime,
        });

        if (emailResult.success) {
          await db
            .update(announcementSettings)
            .set({ reminderSent: true })
            .where(eq(announcementSettings.announcementId, announcementId));

          results.sent++;
          console.log(
            `[Scheduler] Reminder sent for announcement ${announcementId} to ${recipientEmails.length} recipients`
          );
        } else {
          results.failed++;
          results.errors.push(
            `Announcement ${announcementId}: ${emailResult.error || 'Failed to send reminder'}`
          );
          console.error(
            `[Scheduler] Failed to send reminder for announcement ${announcementId}:`,
            emailResult.error
          );
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Announcement ${announcementId}: ${errorMessage}`);
        console.error(`[Scheduler] Error processing announcement ${announcementId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in processReminderEmails:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}


async function resolveRecipientEmails(targetYears: number[] | null): Promise<string[]> {
  const db = getDb();
  const rows = await db.select({ email: users.email }).from(users);
  const normalizedTargets = Array.isArray(targetYears) && targetYears.length > 0 ? targetYears : null;

  return rows
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email))
    .filter((email) => {
      if (!normalizedTargets) {
        return true; 
      }
      const intakeCode = extractIntakeCodeFromEmail(email);
      if (!intakeCode) {
        return false;
      }
      return normalizedTargets.includes(intakeCode);
    });
}


async function sendReminderEmail({
  title,
  description,
  category,
  recipientEmails,
  reminderTime,
}: {
  title: string;
  description: string;
  category: string;
  recipientEmails: string[];
  reminderTime: Date;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { Resend } = await import('resend');
    const { getConfig } = await import('@/lib/config/config');
    const { getEnvConfig } = await import('@/lib/config/env');
    const { formatDateTime } = await import('@/utils/dateUtils');

    const env = getEnvConfig();
    const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

    if (!resend) {
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

    const reminderTimeFormatted = formatDateTime(reminderTime.toISOString(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, 'en-US', 'Not specified');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reminder: ${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #f59e0b; margin-top: 0; font-size: 22px;">${title}</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 15px 0; color: #555; font-size: 16px; white-space: pre-wrap;">${description}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #f59e0b;">Category:</td>
                  <td style="padding: 8px 0; color: #555; text-transform: capitalize;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #f59e0b;">Reminder Time:</td>
                  <td style="padding: 8px 0; color: #555;">${reminderTimeFormatted}</td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${cfg.frontendUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Announcement</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated reminder from the SST Announcement System.</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Reminder: ${title}

${description}

Category: ${category}
Reminder Time: ${reminderTimeFormatted}

View announcement: ${cfg.frontendUrl}

This is an automated reminder from the SST Announcement System.
    `.trim();

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmails,
      subject: `⏰ Reminder: ${title}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Error sending reminder email via Resend:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reminder email',
      };
    }

    return {
      success: true,
      message: `Reminder email sent successfully to ${recipientEmails.length} recipient(s)`,
    };
  } catch (error) {
    console.error('Unexpected error sending reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder email',
    };
  }
}

