import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, generalLimiterOptions, adminLimiterOptions } from '@/lib/middleware/rateLimit';
import { fetchAnnouncementById } from '@/lib/data/announcements';
import { deleteAnnouncementFiles } from '@/lib/data/announcement-files';
import { deleteMultipleFromImageKit } from '@/lib/services/imagekit';
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';
import { requireAllowedDomain } from '@/lib/middleware/domain';
import { BadRequestError, NotFoundError } from '@/lib/utils/errors';
import { parseId } from '@/lib/utils/validation';
import { getDb } from '@/lib/config/db';
import { announcements, announcementSettings, announcementTargets } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { normalizeTargetBatches } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, generalLimiterOptions);
    const { id: idParam } = await params;
    const id = parseId(idParam, 'Announcement ID');
    const announcement = await fetchAnnouncementById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement', id);
    }

    return NextResponse.json({ success: true, data: announcement });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, adminLimiterOptions);
    const user = await requireAuth(request, { enforceDomain: true });
    requireAllowedDomain(user);
    requireAdmin(user);

    const { id: idParam } = await params;
    const id = parseId(idParam, 'Announcement ID');
    const body = await request.json();
    
    const db = getDb();

    // Check if announcement exists
    const existing = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    if (existing.length === 0) {
      throw new NotFoundError('Announcement', id);
    }

    // Separate fields by table
    const announcementUpdates: Record<string, unknown> = {};
    const settingsUpdates: Record<string, unknown> = {};
    let targetYears: number[] | null = null;
    let targetBatches: string[] | null = null;
    let deadlines: Array<{ label: string; date: string }> | null = null;

    // Core announcement fields
    if (body.title !== undefined) announcementUpdates.title = body.title;
    if (body.description !== undefined) announcementUpdates.description = body.description;
    if (body.category !== undefined) announcementUpdates.category = body.category;
    if (body.is_active !== undefined) announcementUpdates.isActive = body.is_active;
    if (body.status !== undefined) announcementUpdates.status = body.status;
    if (body.priority_level !== undefined) announcementUpdates.priorityLevel = body.priority_level;
    if (body.is_emergency !== undefined) announcementUpdates.isEmergency = body.is_emergency;
    if (body.url !== undefined) announcementUpdates.url = body.url || null;

    // Settings fields
    if (body.expiry_date !== undefined) {
      settingsUpdates.expiryDate = body.expiry_date ? new Date(body.expiry_date) : null;
    }
    if (body.scheduled_at !== undefined) {
      settingsUpdates.scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null;
    }
    if (body.reminder_time !== undefined) {
      settingsUpdates.reminderTime = body.reminder_time ? new Date(body.reminder_time) : null;
    }
    if (body.priority_until !== undefined) {
      settingsUpdates.priorityUntil = body.priority_until ? new Date(body.priority_until) : null;
    }
    if (body.emergency_expires_at !== undefined) {
      settingsUpdates.emergencyExpiresAt = body.emergency_expires_at ? new Date(body.emergency_expires_at) : null;
    }
    if (body.send_email !== undefined) settingsUpdates.sendEmail = body.send_email;
    if (body.email_sent !== undefined) settingsUpdates.emailSent = body.email_sent;
    if (body.send_tv !== undefined) settingsUpdates.sendTV = body.send_tv;
    if (body.visible_after !== undefined) {
      settingsUpdates.visibleAfter = body.visible_after ? new Date(body.visible_after) : null;
    }

    // Targets and deadlines
    if (body.target_years !== undefined) {
      targetYears = normalizeTargetYears(body.target_years);
    }
    if (body.target_batches !== undefined) {
      targetBatches = normalizeTargetBatches(body.target_batches);
    }
    if (body.deadlines !== undefined) {
      if (body.deadlines && Array.isArray(body.deadlines) && body.deadlines.length > 0) {
        const processedDeadlines = body.deadlines
          .map((d: any) => {
            if (!d || typeof d !== 'object') return null;
            const label = String(d.label || '').trim();
            if (!label) return null;
            
            let dateStr = d.date;
            if (dateStr) {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return null;
              dateStr = date.toISOString();
            } else {
              return null;
            }
            
            return { label, date: dateStr };
          })
          .filter((d: any) => d !== null)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        deadlines = processedDeadlines.length === 0 ? null : processedDeadlines;
      } else {
        deadlines = null;
      }
    }

    // Update announcements table
    if (Object.keys(announcementUpdates).length > 0) {
      announcementUpdates.updatedAt = new Date();
      await db
        .update(announcements)
        .set(announcementUpdates)
        .where(eq(announcements.id, id));
    }

    // Update or insert into announcement_settings
    if (Object.keys(settingsUpdates).length > 0) {
      const existingSettings = await db
        .select()
        .from(announcementSettings)
        .where(eq(announcementSettings.announcementId, id))
        .limit(1);
      
      if (existingSettings.length > 0) {
        await db
          .update(announcementSettings)
          .set(settingsUpdates)
          .where(eq(announcementSettings.announcementId, id));
      } else {
        await db.insert(announcementSettings).values({
          announcementId: id,
          ...settingsUpdates,
        } as any);
      }
    }

    // Update targets: delete existing and insert new ones
    if (targetYears !== undefined || targetBatches !== undefined || deadlines !== undefined) {
      // Delete existing targets
      await db
        .delete(announcementTargets)
        .where(eq(announcementTargets.announcementId, id));

      // Insert new targets
      const targetInserts: Array<{ announcementId: number; targetYear?: number | null; targetBatches?: string | null; deadlineDate?: Date | null; deadlineLabel?: string | null }> = [];

      // Add target years
      if (targetYears && targetYears.length > 0) {
        for (const year of targetYears) {
          targetInserts.push({
            announcementId: id,
            targetYear: year,
            targetBatches: null,
            deadlineDate: null,
            deadlineLabel: null,
          });
        }
      }

      // Add target batches as JSON array
      if (targetBatches && targetBatches.length > 0) {
        targetInserts.push({
          announcementId: id,
          targetYear: null,
          targetBatches: JSON.stringify(targetBatches), // Store as JSON array: ["24A", "25B"]
          deadlineDate: null,
          deadlineLabel: null,
        });
      }

      // Add deadlines
      if (deadlines && deadlines.length > 0) {
        for (const deadline of deadlines) {
          targetInserts.push({
            announcementId: id,
            targetYear: null,
            targetBatches: null,
            deadlineDate: new Date(deadline.date),
            deadlineLabel: deadline.label,
          });
        }
      }

      if (targetInserts.length > 0) {
        await db.insert(announcementTargets).values(targetInserts);
      }
    }

    // Fetch updated announcement
    const updated = await fetchAnnouncementById(id);
    if (!updated) {
      throw new NotFoundError('Announcement', id);
    }

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: error.status || 500 }
    );
  }
}

// Import normalizeTargetBatches from the main route file
// normalizeTargetBatches is imported at the top

function normalizeTargetYears(value: unknown): number[] | null {
  if (!value) {
    return null;
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const normalized = Array.from(
    new Set(
      value
        .map((entry) => {
          if (typeof entry === 'string') {
            const parsed = parseInt(entry, 10);
            return Number.isNaN(parsed) ? null : parsed;
          }
          return typeof entry === 'number' ? entry : null;
        })
        .filter((entry): entry is number => entry !== null)
        .filter((year) => Number.isInteger(year) && year >= 1 && year <= 6)
    )
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, adminLimiterOptions);
    const user = await requireAuth(request, { enforceDomain: true });
    requireAllowedDomain(user);
    requireAdmin(user);

    const { id: idParam } = await params;
    const id = parseId(idParam, 'Announcement ID');
    
    // Delete associated files from ImageKit before deleting the announcement
    const imagekitFileIds = await deleteAnnouncementFiles(id);
    if (imagekitFileIds.length > 0) {
      await deleteMultipleFromImageKit(imagekitFileIds);
    }
    
    const db = getDb();
    const result = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning({ id: announcements.id });

    if (result.length === 0) {
      throw new NotFoundError('Announcement', id);
    }

    return NextResponse.json({ 
      success: true, 
      data: { message: `Announcement with id ${id} deleted` } 
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: error.status || 500 }
    );
  }
}
