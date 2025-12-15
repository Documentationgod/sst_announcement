import { pgTable, serial, text, varchar, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['student', 'student_admin', 'admin', 'super_admin', 'user']);

// Enum for announcement status
export const announcementStatusEnum = pgEnum('announcement_status', [
  'scheduled',
  'active',
  'urgent',
  'expired'
]);

// Enum for announcement category
export const announcementCategoryEnum = pgEnum('announcement_category', [
  'academic',
  'sil',
  'club',
  'general'
]);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  username: varchar('username', { length: 100 }),
  role: userRoleEnum('role').default('student').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
});

// 1. Announcements table (core metadata)
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: announcementCategoryEnum('category').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  status: announcementStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true),
  priorityLevel: integer('priority_level').default(3).notNull(),
  isEmergency: boolean('is_emergency').default(false).notNull(),
  // Optional URL used for TV display / QR code
  tvUrl: varchar('tv_url', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// 2. Announcement settings table (optional scheduling + delivery settings)
export const announcementSettings = pgTable('announcement_settings', {
  announcementId: integer('announcement_id').primaryKey().references(() => announcements.id, { onDelete: 'cascade' }),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  reminderTime: timestamp('reminder_time', { withTimezone: true }),
  priorityUntil: timestamp('priority_until', { withTimezone: true }),
  emergencyExpiresAt: timestamp('emergency_expires_at', { withTimezone: true }),
  sendEmail: boolean('send_email').default(false).notNull(),
  emailSent: boolean('email_sent').default(false).notNull(),
  reminderSent: boolean('reminder_sent').default(false).notNull(),
  sendTV: boolean('send_tv').default(false).notNull(),
  visibleAfter: timestamp('visible_after', { withTimezone: true }),
});

// 3. Announcement targets table (target years + deadlines)
export const announcementTargets = pgTable('announcement_targets', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  targetYear: integer('target_year'),
  deadlineDate: timestamp('deadline_date', { withTimezone: true }),
  deadlineLabel: text('deadline_label'),
});

// 4. Announcement files table (multiple PDFs / resources per announcement)
export const announcementFiles = pgTable('announcement_files', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),          // Cloudinary secure URL
  publicId: text('public_id'),         // Cloudinary public_id (optional)
  fileName: text('file_name'),         // Original file name
  mimeType: text('mime_type').default('application/pdf'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  announcements: many(announcements),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  settings: one(announcementSettings, {
    fields: [announcements.id],
    references: [announcementSettings.announcementId],
  }),
  targets: many(announcementTargets),
  files: many(announcementFiles),
}));

export const announcementSettingsRelations = relations(announcementSettings, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementSettings.announcementId],
    references: [announcements.id],
  }),
}));

export const announcementTargetsRelations = relations(announcementTargets, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementTargets.announcementId],
    references: [announcements.id],
  }),
}));

export const announcementFilesRelations = relations(announcementFiles, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementFiles.announcementId],
    references: [announcements.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementSettings = typeof announcementSettings.$inferSelect;
export type NewAnnouncementSettings = typeof announcementSettings.$inferInsert;
export type AnnouncementTarget = typeof announcementTargets.$inferSelect;
export type NewAnnouncementTarget = typeof announcementTargets.$inferInsert;
export type AnnouncementFile = typeof announcementFiles.$inferSelect;
export type NewAnnouncementFile = typeof announcementFiles.$inferInsert;
