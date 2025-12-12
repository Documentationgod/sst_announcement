import { desc, eq } from 'drizzle-orm';
import { getDb, getPool } from '../config/db';
import { announcements, announcementSettings, announcementTargets } from '../schema';

export type AnnouncementRecord = typeof announcements.$inferSelect;
export type AnnouncementSettingsRecord = typeof announcementSettings.$inferSelect;
export type AnnouncementTargetRecord = typeof announcementTargets.$inferSelect;

interface FullAnnouncementData {
  announcement: AnnouncementRecord;
  settings?: AnnouncementSettingsRecord | null;
  targets: AnnouncementTargetRecord[];
}

export function mapAnnouncement(data: FullAnnouncementData) {
  const { announcement, settings, targets } = data;
  
  // Extract target years from targets table
  const targetYears = targets
    .filter(t => t.targetYear !== null)
    .map(t => t.targetYear!)
    .filter((year, index, arr) => arr.indexOf(year) === index) // Remove duplicates
    .sort((a, b) => a - b);
  
  // Extract deadlines from targets table
  const deadlines = targets
    .filter((t): t is typeof t & { deadlineDate: Date | string } => 
      t.deadlineDate !== null && t.deadlineDate !== undefined
    )
    .map(t => {
      // Handle both Date objects and string dates from database
      const deadlineDate = t.deadlineDate instanceof Date 
        ? t.deadlineDate 
        : new Date(t.deadlineDate);
      
      return {
        label: t.deadlineLabel || '',
        date: deadlineDate.toISOString()
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    category: announcement.category,
    author_id: announcement.authorId,
    created_at: announcement.createdAt,
    updated_at: announcement.updatedAt,
    expiry_date: settings?.expiryDate || null,
    deadlines: deadlines.length > 0 ? deadlines : null,
    scheduled_at: settings?.scheduledAt || null,
    reminder_time: settings?.reminderTime || null,
    is_active: announcement.isActive,
    status: announcement.status,
    send_email: settings?.sendEmail ?? false,
    email_sent: settings?.emailSent ?? false,
    send_tv: settings?.sendTV ?? false,
    priority_until: settings?.priorityUntil || null,
    priority_level: announcement.priorityLevel ?? 3,
    is_emergency: announcement.isEmergency ?? false,
    emergency_expires_at: settings?.emergencyExpiresAt || null,
    visible_after: settings?.visibleAfter || null,
    target_years: targetYears.length > 0 ? targetYears : null,
  };
}

export function mapAnnouncements(dataArray: FullAnnouncementData[]) {
  return dataArray.map(mapAnnouncement);
}

async function fetchAnnouncementsWithJoins(options?: { limit?: number; offset?: number }) {
  const pool = getPool();
  
  let query = `
    SELECT 
      a.*,
      s.expiry_date, s.scheduled_at, s.reminder_time, s.priority_until,
      s.emergency_expires_at, s.send_email, s.email_sent, s.reminder_sent, s.send_tv, s.visible_after,
      t.id as target_id, t.target_year, t.deadline_date, t.deadline_label
    FROM announcements a
    LEFT JOIN announcement_settings s ON a.id = s.announcement_id
    LEFT JOIN announcement_targets t ON a.id = t.announcement_id
    ORDER BY a.created_at DESC
  `;
  
  const params: any[] = [];
  if (options?.limit !== undefined) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }
  if (options?.offset !== undefined) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }
  
  const result = await pool.query(query, params);
  
  // Group by announcement ID
  const announcementMap = new Map<number, FullAnnouncementData>();
  
  for (const row of result.rows) {
    const announcementId = row.id;
    
    if (!announcementMap.has(announcementId)) {
      announcementMap.set(announcementId, {
        announcement: {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          authorId: row.author_id,
          status: row.status,
          isActive: row.is_active,
          priorityLevel: row.priority_level,
          isEmergency: row.is_emergency,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        settings: row.expiry_date || row.scheduled_at || row.reminder_time || 
                 row.priority_until || row.emergency_expires_at || 
                 row.send_email || row.email_sent || row.reminder_sent || row.send_tv || row.visible_after
          ? {
              announcementId: row.id,
              expiryDate: row.expiry_date,
              scheduledAt: row.scheduled_at,
              reminderTime: row.reminder_time,
              priorityUntil: row.priority_until,
              emergencyExpiresAt: row.emergency_expires_at,
              sendEmail: row.send_email ?? false,
              emailSent: row.email_sent ?? false,
              reminderSent: row.reminder_sent ?? false,
              sendTV: row.send_tv ?? false,
              visibleAfter: row.visible_after,
            }
          : null,
        targets: [],
      });
    }
    
    const data = announcementMap.get(announcementId)!;
    
    // Add target if it exists
    if (row.target_id) {
      data.targets.push({
        id: row.target_id,
        announcementId: row.id,
        targetYear: row.target_year,
        deadlineDate: row.deadline_date,
        deadlineLabel: row.deadline_label,
      });
    }
  }
  
  return Array.from(announcementMap.values());
}

export async function fetchAllAnnouncements(options?: { limit?: number; offset?: number }) {
  const data = await fetchAnnouncementsWithJoins(options);
  return mapAnnouncements(data);
}

export async function fetchAnnouncementById(id: number) {
  const pool = getPool();
  
  const result = await pool.query(
    `
    SELECT 
      a.*,
      s.expiry_date, s.scheduled_at, s.reminder_time, s.priority_until,
      s.emergency_expires_at, s.send_email, s.email_sent, s.reminder_sent, s.send_tv, s.visible_after,
      t.id as target_id, t.target_year, t.deadline_date, t.deadline_label
    FROM announcements a
    LEFT JOIN announcement_settings s ON a.id = s.announcement_id
    LEFT JOIN announcement_targets t ON a.id = t.announcement_id
    WHERE a.id = $1
    `,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Group by announcement ID
  const announcementMap = new Map<number, FullAnnouncementData>();
  
  for (const row of result.rows) {
    const announcementId = row.id;
    
    if (!announcementMap.has(announcementId)) {
      announcementMap.set(announcementId, {
        announcement: {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          authorId: row.author_id,
          status: row.status,
          isActive: row.is_active,
          priorityLevel: row.priority_level,
          isEmergency: row.is_emergency,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        settings: row.expiry_date || row.scheduled_at || row.reminder_time || 
                 row.priority_until || row.emergency_expires_at || 
                 row.send_email || row.email_sent || row.reminder_sent || row.send_tv || row.visible_after
          ? {
              announcementId: row.id,
              expiryDate: row.expiry_date,
              scheduledAt: row.scheduled_at,
              reminderTime: row.reminder_time,
              priorityUntil: row.priority_until,
              emergencyExpiresAt: row.emergency_expires_at,
              sendEmail: row.send_email ?? false,
              emailSent: row.email_sent ?? false,
              reminderSent: row.reminder_sent ?? false,
              sendTV: row.send_tv ?? false,
              visibleAfter: row.visible_after,
            }
          : null,
        targets: [],
      });
    }
    
    const data = announcementMap.get(announcementId)!;
    
    // Add target if it exists
    if (row.target_id) {
      data.targets.push({
        id: row.target_id,
        announcementId: row.id,
        targetYear: row.target_year,
        deadlineDate: row.deadline_date,
        deadlineLabel: row.deadline_label,
      });
    }
  }
  
  const announcementData = Array.from(announcementMap.values())[0];
  return announcementData ? mapAnnouncement(announcementData) : null;
}

export async function getTvData() {
  const pool = getPool();
  
  const result = await pool.query(
    `
    SELECT 
      a.*,
      s.expiry_date, s.scheduled_at, s.reminder_time, s.priority_until,
      s.emergency_expires_at, s.send_email, s.email_sent, s.reminder_sent, s.send_tv, s.visible_after,
      t.id as target_id, t.target_year, t.deadline_date, t.deadline_label
    FROM announcements a
    INNER JOIN announcement_settings s ON a.id = s.announcement_id
    LEFT JOIN announcement_targets t ON a.id = t.announcement_id
    WHERE s.send_tv = true
    ORDER BY a.created_at DESC
    LIMIT 10
    `
  );
  
  // Group by announcement ID
  const announcementMap = new Map<number, FullAnnouncementData>();
  
  for (const row of result.rows) {
    const announcementId = row.id;
    
    if (!announcementMap.has(announcementId)) {
      announcementMap.set(announcementId, {
        announcement: {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          authorId: row.author_id,
          status: row.status,
          isActive: row.is_active,
          priorityLevel: row.priority_level,
          isEmergency: row.is_emergency,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        settings: {
          announcementId: row.id,
          expiryDate: row.expiry_date,
          scheduledAt: row.scheduled_at,
          reminderTime: row.reminder_time,
          priorityUntil: row.priority_until,
          emergencyExpiresAt: row.emergency_expires_at,
          sendEmail: row.send_email ?? false,
          emailSent: row.email_sent ?? false,
          reminderSent: row.reminder_sent ?? false,
          sendTV: row.send_tv ?? false,
          visibleAfter: row.visible_after,
        },
        targets: [],
      });
    }
    
    const data = announcementMap.get(announcementId)!;
    
    // Add target if it exists
    if (row.target_id) {
      data.targets.push({
        id: row.target_id,
        announcementId: row.id,
        targetYear: row.target_year,
        deadlineDate: row.deadline_date,
        deadlineLabel: row.deadline_label,
      });
    }
  }
  
  return mapAnnouncements(Array.from(announcementMap.values()));
}
