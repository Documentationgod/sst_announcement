-- Migration: Create announcement_files table for ImageKit attachments
-- Purpose: Store metadata and URLs for files/images attached to announcements
-- Relationship: One announcement can have many files (one-to-many)

-- Create announcement_files table
CREATE TABLE IF NOT EXISTS announcement_files (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key relationship to announcements
  announcement_id UUID NOT NULL,
  
  -- File metadata from ImageKit
  file_url TEXT NOT NULL,
  imagekit_file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- File categorization (image or document)
  file_category VARCHAR(20) NOT NULL CHECK (file_category IN ('image', 'document')),
  
  -- Display ordering for multiple attachments
  display_order INTEGER DEFAULT 0,
  
  -- Audit fields
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint with cascade delete
  CONSTRAINT fk_announcement 
    FOREIGN KEY (announcement_id) 
    REFERENCES announcements(id) 
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_announcement_files_announcement_id ON announcement_files(announcement_id);
CREATE INDEX idx_announcement_files_created_at ON announcement_files(created_at);
CREATE INDEX idx_announcement_files_file_category ON announcement_files(file_category);

-- Add comments for documentation
COMMENT ON TABLE announcement_files IS 'Stores metadata and ImageKit URLs for files and images attached to announcements';
COMMENT ON COLUMN announcement_files.announcement_id IS 'Reference to the parent announcement (cascade delete enabled)';
COMMENT ON COLUMN announcement_files.file_url IS 'Complete CDN URL from ImageKit for accessing the file';
COMMENT ON COLUMN announcement_files.imagekit_file_id IS 'Unique identifier from ImageKit for deletion operations';
COMMENT ON COLUMN announcement_files.file_category IS 'Either ''image'' or ''document'' for UI rendering logic';
COMMENT ON COLUMN announcement_files.display_order IS 'Order in which attachments should be displayed (lower numbers first)';
COMMENT ON COLUMN announcement_files.uploaded_by IS 'Clerk user ID of the uploader';
