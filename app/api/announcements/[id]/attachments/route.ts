import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createAnnouncementFile,
  getAnnouncementFiles,
  deleteAnnouncementFile,
  getAnnouncementFileById,
} from '@/lib/data/announcement-files';
import {
  uploadToImageKit,
  validateFile,
  getFileCategory,
  deleteFromImageKit,
} from '@/lib/services/imagekit';

/**
 * GET /api/announcements/[id]/attachments
 * Fetch all attachments for an announcement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await getAnnouncementFiles(params.id);

    return NextResponse.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachments',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements/[id]/attachments
 * Upload a new attachment
 * Requires: student-admin, admin, or super-admin role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[UPLOAD] Starting upload for announcement:', params.id);
    const { userId } = await auth();

    if (!userId) {
      console.log('[UPLOAD] Unauthorized - no userId');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[UPLOAD] User authenticated:', userId);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const displayOrder = formData.get('displayOrder') as string;

    console.log('[UPLOAD] File received:', file ? file.name : 'none', 'Size:', file ? file.size : 0);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      console.log('[UPLOAD] Validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('[UPLOAD] File validated, starting ImageKit upload');

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to ImageKit
    const uploadResult = await uploadToImageKit(
      buffer,
      file.name,
      `announcements/${params.id}`
    );

    console.log('[UPLOAD] ImageKit upload successful:', uploadResult.fileId);

    // Save metadata to database
    const fileCategory = getFileCategory(file.type);
    const fileRecord = await createAnnouncementFile({
      announcement_id: params.id,
      file_url: uploadResult.url,
      imagekit_file_id: uploadResult.fileId,
      file_name: uploadResult.name,
      mime_type: file.type,
      file_category: fileCategory,
      display_order: displayOrder ? parseInt(displayOrder, 10) : 0,
      uploaded_by: userId,
    });

    console.log('[UPLOAD] Database record created:', fileRecord.id);

    return NextResponse.json({
      success: true,
      data: fileRecord,
    });
  } catch (error) {
    console.error('[UPLOAD] Error uploading attachment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload attachment',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/announcements/[id]/attachments?fileId=xxx
 * Delete an attachment
 * Requires: student-admin, admin, or super-admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      );
    }

    // Get file record
    const fileRecord = await getAnnouncementFileById(fileId);
    if (!fileRecord) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from ImageKit
    await deleteFromImageKit(fileRecord.imagekit_file_id);

    // Delete from database
    await deleteAnnouncementFile(fileId);

    return NextResponse.json({
      success: true,
      data: { message: 'Attachment deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attachment',
      },
      { status: 500 }
    );
  }
}
