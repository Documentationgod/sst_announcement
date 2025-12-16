# File Upload Feature - ImageKit Integration

## Overview
This feature adds support for attaching images and documents to announcements using ImageKit as the CDN provider.

## Database Schema

### Table: `announcement_files`
Stores metadata for all files attached to announcements.

```sql
CREATE TABLE announcement_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  imagekit_file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_category VARCHAR(20) NOT NULL CHECK (file_category IN ('image', 'document')),
  display_order INTEGER DEFAULT 0,
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_announcement 
    FOREIGN KEY (announcement_id) 
    REFERENCES announcements(id) 
    ON DELETE CASCADE
);
```

**To apply the schema:**
```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL < scripts/create-announcement-files-table.sql
```

## Environment Variables

Add the following to your `.env.local`:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

**How to get ImageKit credentials:**
1. Sign up at https://imagekit.io
2. Go to Developer Options → API Keys
3. Copy Public Key, Private Key, and URL Endpoint

## Features

### User Capabilities

**Student-Admin, Admin, Super-Admin:**
- Upload multiple images and documents per announcement
- Preview images before publishing
- Remove attachments before publishing
- See upload progress and errors

**Students:**
- View images inline within announcements
- Download attached documents
- Cannot upload attachments

### File Restrictions

**Images:**
- Formats: JPG, PNG, GIF, WebP
- Max size: 5MB per file

**Documents:**
- Formats: PDF, Word, Excel, PowerPoint, TXT
- Max size: 10MB per file

## API Endpoints

### Upload Attachment
```
POST /api/announcements/[id]/attachments
Content-Type: multipart/form-data

Body:
- file: File (required)
- displayOrder: number (optional)

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_url": "https://...",
    "file_name": "document.pdf",
    ...
  }
}
```

### Get Attachments
```
GET /api/announcements/[id]/attachments

Response:
{
  "success": true,
  "data": [...]
}
```

### Delete Attachment
```
DELETE /api/announcements/[id]/attachments?fileId=uuid

Response:
{
  "success": true,
  "data": { "message": "Attachment deleted successfully" }
}
```

## Data Flow

### Upload Flow
1. User selects files in CreateAnnouncementForm
2. Form validation checks file size and type
3. Announcement is created first
4. Each file is uploaded to ImageKit
5. ImageKit returns CDN URL and file ID
6. Metadata is saved to `announcement_files` table
7. User sees success/error for each upload

### Deletion Flow
1. User deletes announcement
2. Backend fetches all `imagekit_file_id` values
3. Files are deleted from ImageKit
4. Database cascade deletes all `announcement_files` records

## File Storage Structure

```
ImageKit Folder Structure:
/announcements/
  /{announcement_id}/
    image1.jpg
    document1.pdf
    ...
```

## Security

- All uploads require authentication
- Only admin roles can upload
- Files are validated for type and size
- ImageKit provides CDN security and optimization
- Attachment records cascade delete with announcements

## UI Integration

The file upload section appears in `CreateAnnouncementForm` immediately below the description field. It includes:

- **Add Files Button**: Opens file picker
- **Preview Section**: Shows thumbnails for images, icons for documents
- **File Info**: Name, size, upload status
- **Remove Button**: Deletes from queue before publish
- **Progress Indicators**: Visual feedback during upload

## Development Notes

### Key Files Created/Modified:

**Database:**
- `scripts/create-announcement-files-table.sql` - Schema definition

**Configuration:**
- `lib/config/imagekit.ts` - ImageKit client setup
- `lib/config/env.ts` - Environment variable validation

**Services:**
- `lib/services/imagekit.ts` - Upload/delete/validation logic
- `lib/data/announcement-files.ts` - Database operations

**API Routes:**
- `app/api/announcements/[id]/attachments/route.ts` - CRUD endpoints
- `app/api/announcements/[id]/route.ts` - Updated DELETE handler

**UI Components:**
- `components/ui/FileUploadSection.tsx` - File upload interface
- `components/forms/CreateAnnouncementForm.tsx` - Integrated form

**Types:**
- `lib/types/index.ts` - AnnouncementFile and AttachmentUpload types

## Testing Checklist

- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Upload documents (PDF, Word, etc.)
- [ ] Remove attachment before publish
- [ ] Verify file size validation
- [ ] Verify file type validation
- [ ] Test announcement with attachments creation
- [ ] Delete announcement and verify ImageKit cleanup
- [ ] Test attachment display in announcement view
- [ ] Verify role-based permissions

## Future Enhancements

- [ ] Drag-and-drop file upload
- [ ] Image cropping/editing
- [ ] Bulk attachment deletion
- [ ] Attachment search/filter
- [ ] File compression before upload
- [ ] Video attachment support
