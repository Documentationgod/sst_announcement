# Quick Setup Guide for File Upload Feature

## 1. Install Dependencies
Already done! ImageKit SDK is installed.

## 2. Database Migration

Run the SQL migration to create the `announcement_files` table:

```bash
# Replace with your actual DATABASE_URL
psql "your_database_url_here" -f scripts/create-announcement-files-table.sql
```

**Or** using Supabase dashboard:
1. Go to your Supabase project → SQL Editor
2. Open and paste the content of `scripts/create-announcement-files-table.sql`
3. Run the query

## 3. Configure ImageKit

### Get ImageKit Credentials
1. Sign up at https://imagekit.io (free tier available)
2. Go to Dashboard → Developer Options → API Keys
3. Copy the following:
   - Public Key
   - Private Key  
   - URL Endpoint (format: `https://ik.imagekit.io/your_id`)

### Add to Environment Variables
Create or update `.env.local`:

```env
IMAGEKIT_PUBLIC_KEY=public_xxx...
IMAGEKIT_PRIVATE_KEY=private_xxx...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

## 4. Verify Setup

```bash
npx tsx scripts/verify-imagekit-setup.ts
```

This will check:
- ✅ Environment variables are set
- ✅ ImageKit client initializes
- ✅ Authentication works

## 5. Test the Feature

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Login as admin/student-admin

3. Create a new announcement

4. Look for "Attachments (Optional)" section below description

5. Click "Add Files" and upload:
   - Images: JPG, PNG, GIF, WebP (max 5MB each)
   - Documents: PDF, Word, Excel, PowerPoint (max 10MB each)

6. Submit the announcement

7. Check that files appear in ImageKit dashboard

## Troubleshooting

### "ImageKit credentials not configured"
- Check `.env.local` exists and has all three variables
- Restart dev server after adding environment variables
- Verify no extra spaces or quotes in values

### File upload fails
- Check file size (images: 5MB, documents: 10MB)
- Verify file type is supported
- Check browser console for errors
- Verify ImageKit credentials are valid

### Database errors
- Ensure migration ran successfully
- Check `announcement_files` table exists
- Verify foreign key relationship to `announcements` table

### Files not appearing
- Check browser network tab for API errors
- Verify announcements are created first (files need announcement_id)
- Check ImageKit dashboard for uploaded files

## File Locations

**Backend:**
- Schema: `scripts/create-announcement-files-table.sql`
- Config: `lib/config/imagekit.ts`, `lib/config/env.ts`
- Services: `lib/services/imagekit.ts`
- Data layer: `lib/data/announcement-files.ts`
- API routes: `app/api/announcements/[id]/attachments/route.ts`

**Frontend:**
- Upload UI: `components/ui/FileUploadSection.tsx`
- Display UI: `components/ui/AttachmentList.tsx`
- Form integration: `components/forms/CreateAnnouncementForm.tsx`
- API service: `services/api.ts`

**Types:**
- `lib/types/index.ts` - AnnouncementFile, AttachmentUpload

## Next Steps

After successful setup:

1. **Test cascade deletion**: Delete an announcement with attachments and verify files are removed from ImageKit

2. **Add AttachmentList to announcement view pages**: Import and use the `AttachmentList` component wherever announcements are displayed

3. **Consider additional features**:
   - Drag-and-drop upload
   - Image preview in lightbox
   - Edit announcement attachments
   - Attachment analytics

## Support

For issues or questions:
1. Check `docs/FILE_UPLOAD_FEATURE.md` for detailed documentation
2. Review error messages in browser console and terminal
3. Verify all setup steps were completed
