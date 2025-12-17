import { getImageKit } from '@/lib/config/imagekit';

export interface UploadedFile {
  fileId: string;
  url: string;
  name: string;
  filePath: string;
  size: number;
  fileType: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check file type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported',
    };
  }

  return { valid: true };
}

/**
 * Determine file category based on MIME type
 */
export function getFileCategory(mimeType: string): 'image' | 'document' {
  return ALLOWED_IMAGE_TYPES.includes(mimeType) ? 'image' : 'document';
}

/**
 * Upload file to ImageKit
 */
export async function uploadToImageKit(
  file: Buffer | string,
  fileName: string,
  folder: string = 'announcements'
): Promise<UploadedFile> {
  try {
    const imagekit = getImageKit();

    console.log('[ImageKit] Uploading file:', fileName, 'to folder:', folder);
    console.log('[ImageKit] File type:', typeof file, 'Size:', file instanceof Buffer ? file.length : 'N/A');

    const result = await imagekit.upload({
      file,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    console.log('[ImageKit] Upload successful:', result.fileId);

    return {
      fileId: result.fileId,
      url: result.url,
      name: result.name,
      filePath: result.filePath,
      size: result.size,
      fileType: result.fileType,
    };
  } catch (error) {
    console.error('[ImageKit] Upload error details:', error);
    console.error('[ImageKit] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[ImageKit] Error stack:', error instanceof Error ? error.stack : 'No stack');
    if (error && typeof error === 'object') {
      console.error('[ImageKit] Full error object:', JSON.stringify(error, null, 2));
    }
    throw new Error(`Failed to upload file to ImageKit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from ImageKit
 */
export async function deleteFromImageKit(fileId: string): Promise<boolean> {
  try {
    const imagekit = getImageKit();
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error('ImageKit delete error:', error);
    return false;
  }
}

/**
 * Delete multiple files from ImageKit
 */
export async function deleteMultipleFromImageKit(fileIds: string[]): Promise<void> {
  const deletePromises = fileIds.map(fileId => deleteFromImageKit(fileId));
  await Promise.allSettled(deletePromises);
}
