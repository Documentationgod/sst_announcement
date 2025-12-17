-- Migration: Update announcement_files table from Cloudinary to ImageKit
-- This script updates the existing table structure to work with ImageKit

-- Drop the old Cloudinary-specific columns and add ImageKit columns
ALTER TABLE announcement_files 
  DROP COLUMN IF EXISTS cloudinary_url,
  DROP COLUMN IF EXISTS public_id,
  ADD COLUMN IF NOT EXISTS file_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS imagekit_file_id VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_category VARCHAR(20) NOT NULL DEFAULT 'document' CHECK (file_category IN ('image', 'document')),
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255) NOT NULL DEFAULT '';

-- Update file_name to have a limit
ALTER TABLE announcement_files 
  ALTER COLUMN file_name TYPE VARCHAR(500);

-- Update mime_type to have a limit
ALTER TABLE announcement_files 
  ALTER COLUMN mime_type TYPE VARCHAR(100);

-- Create missing index for file_category
CREATE INDEX IF NOT EXISTS idx_announcement_files_file_category ON announcement_files(file_category);

-- Add comments for documentation
COMMENT ON TABLE announcement_files IS 'Stores metadata and ImageKit URLs for files and images attached to announcements';
COMMENT ON COLUMN announcement_files.announcement_id IS 'Reference to the parent announcement (cascade delete enabled)';
COMMENT ON COLUMN announcement_files.file_url IS 'Complete CDN URL from ImageKit for accessing the file';
COMMENT ON COLUMN announcement_files.imagekit_file_id IS 'Unique identifier from ImageKit for deletion operations';
COMMENT ON COLUMN announcement_files.file_category IS 'Either ''image'' or ''document'' for UI rendering logic';
COMMENT ON COLUMN announcement_files.display_order IS 'Order in which attachments should be displayed (lower numbers first)';
COMMENT ON COLUMN announcement_files.uploaded_by IS 'Clerk user ID of the uploader';
