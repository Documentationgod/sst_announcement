-- Complete Database Schema for NeonDB
-- This script creates all tables, enums, and indexes from scratch

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('student', 'student_admin', 'admin', 'super_admin', 'user');

-- Announcement status enum
CREATE TYPE announcement_status AS ENUM ('scheduled', 'active', 'urgent', 'expired');

-- Announcement category enum
CREATE TYPE announcement_category AS ENUM ('academic', 'sil', 'club', 'general');

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  username VARCHAR(100),
  role user_role DEFAULT 'student' NOT NULL,
  batch VARCHAR(10), -- e.g., "23", "24A", "24B", "25A", "25B", "25C", "25D"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Announcements table (core metadata)
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category announcement_category NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status announcement_status DEFAULT 'active' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority_level INTEGER DEFAULT 3 NOT NULL,
  is_emergency BOOLEAN DEFAULT FALSE NOT NULL,
  url VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Announcement settings table (optional scheduling + delivery settings)
CREATE TABLE announcement_settings (
  announcement_id INTEGER PRIMARY KEY REFERENCES announcements(id) ON DELETE CASCADE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  reminder_time TIMESTAMP WITH TIME ZONE,
  priority_until TIMESTAMP WITH TIME ZONE,
  emergency_expires_at TIMESTAMP WITH TIME ZONE,
  send_email BOOLEAN DEFAULT FALSE NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE NOT NULL,
  reminder_sent BOOLEAN DEFAULT FALSE NOT NULL,
  send_tv BOOLEAN DEFAULT FALSE NOT NULL,
  visible_after TIMESTAMP WITH TIME ZONE
);

-- Announcement targets table (target years + deadlines)
CREATE TABLE announcement_targets (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  target_year INTEGER,
  deadline_date TIMESTAMP WITH TIME ZONE,
  deadline_label TEXT
);

-- Announcement files table (using ImageKit)
CREATE TABLE announcement_files (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  imagekit_file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500),
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  file_category VARCHAR(20) NOT NULL DEFAULT 'document' CHECK (file_category IN ('image', 'document')),
  display_order INTEGER DEFAULT 0,
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index on users
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Indexes on announcements
CREATE INDEX idx_announcements_author_id ON announcements(author_id);
CREATE INDEX idx_announcements_category ON announcements(category);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_is_emergency ON announcements(is_emergency);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- Indexes on announcement_targets
CREATE INDEX idx_announcement_targets_announcement_id ON announcement_targets(announcement_id);
CREATE INDEX idx_announcement_targets_target_year ON announcement_targets(target_year);

-- Indexes on announcement_files
CREATE INDEX idx_announcement_files_announcement_id ON announcement_files(announcement_id);
CREATE INDEX idx_announcement_files_file_category ON announcement_files(file_category);
CREATE INDEX idx_announcement_files_imagekit_file_id ON announcement_files(imagekit_file_id);

-- =====================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Users table
COMMENT ON TABLE users IS 'Stores user information synced from Clerk authentication';
COMMENT ON COLUMN users.clerk_id IS 'Unique identifier from Clerk authentication system';
COMMENT ON COLUMN users.batch IS 'Student batch identifier (e.g., 23, 24A, 25B)';

-- Announcements table
COMMENT ON TABLE announcements IS 'Core announcement metadata and content';
COMMENT ON COLUMN announcements.priority_level IS 'Priority level (1-5, lower is higher priority)';
COMMENT ON COLUMN announcements.is_emergency IS 'Emergency flag for urgent announcements';

-- Announcement settings table
COMMENT ON TABLE announcement_settings IS 'Optional scheduling and delivery settings for announcements';
COMMENT ON COLUMN announcement_settings.announcement_id IS 'One-to-one relationship with announcements table';

-- Announcement targets table
COMMENT ON TABLE announcement_targets IS 'Defines target years and deadlines for announcements';
COMMENT ON COLUMN announcement_targets.target_year IS 'Target batch year (e.g., 2023, 2024, 2025)';

-- Announcement files table
COMMENT ON TABLE announcement_files IS 'Stores metadata and ImageKit URLs for files and images attached to announcements';
COMMENT ON COLUMN announcement_files.announcement_id IS 'Reference to the parent announcement (cascade delete enabled)';
COMMENT ON COLUMN announcement_files.file_url IS 'Complete CDN URL from ImageKit for accessing the file';
COMMENT ON COLUMN announcement_files.imagekit_file_id IS 'Unique identifier from ImageKit for deletion operations';
COMMENT ON COLUMN announcement_files.file_category IS 'Either ''image'' or ''document'' for UI rendering logic';
COMMENT ON COLUMN announcement_files.display_order IS 'Order in which attachments should be displayed (lower numbers first)';
COMMENT ON COLUMN announcement_files.uploaded_by IS 'Clerk user ID of the uploader';

-- =====================================================
-- 5. GRANT PERMISSIONS (if needed)
-- =====================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

