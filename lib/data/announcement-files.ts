import { db } from '@/lib/config/db';

export interface AnnouncementFile {
  id: string;
  announcement_id: string;
  file_url: string;
  imagekit_file_id: string;
  file_name: string;
  mime_type: string;
  file_category: 'image' | 'document';
  display_order: number;
  uploaded_by: string;
  created_at: Date;
}

export interface CreateAnnouncementFileData {
  announcement_id: string;
  file_url: string;
  imagekit_file_id: string;
  file_name: string;
  mime_type: string;
  file_category: 'image' | 'document';
  display_order?: number;
  uploaded_by: string;
}

/**
 * Create a new announcement file record
 */
export async function createAnnouncementFile(
  data: CreateAnnouncementFileData
): Promise<AnnouncementFile> {
  const query = `
    INSERT INTO announcement_files (
      announcement_id,
      file_url,
      imagekit_file_id,
      file_name,
      mime_type,
      file_category,
      display_order,
      uploaded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    data.announcement_id,
    data.file_url,
    data.imagekit_file_id,
    data.file_name,
    data.mime_type,
    data.file_category,
    data.display_order || 0,
    data.uploaded_by,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Get all files for an announcement
 */
export async function getAnnouncementFiles(
  announcementId: string
): Promise<AnnouncementFile[]> {
  const query = `
    SELECT * FROM announcement_files
    WHERE announcement_id = $1
    ORDER BY display_order ASC, created_at ASC
  `;

  const result = await db.query(query, [announcementId]);
  return result.rows;
}

/**
 * Get a single file by ID
 */
export async function getAnnouncementFileById(
  fileId: string
): Promise<AnnouncementFile | null> {
  const query = `
    SELECT * FROM announcement_files
    WHERE id = $1
  `;

  const result = await db.query(query, [fileId]);
  return result.rows[0] || null;
}

/**
 * Delete a file record
 */
export async function deleteAnnouncementFile(fileId: string): Promise<boolean> {
  const query = `
    DELETE FROM announcement_files
    WHERE id = $1
    RETURNING imagekit_file_id
  `;

  const result = await db.query(query, [fileId]);
  return result.rows.length > 0;
}

/**
 * Delete all files for an announcement
 */
export async function deleteAnnouncementFiles(
  announcementId: string
): Promise<string[]> {
  const query = `
    DELETE FROM announcement_files
    WHERE announcement_id = $1
    RETURNING imagekit_file_id
  `;

  const result = await db.query(query, [announcementId]);
  return result.rows.map(row => row.imagekit_file_id);
}

/**
 * Create multiple announcement files in a transaction
 */
export async function createMultipleAnnouncementFiles(
  files: CreateAnnouncementFileData[]
): Promise<AnnouncementFile[]> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const createdFiles: AnnouncementFile[] = [];
    
    for (const fileData of files) {
      const query = `
        INSERT INTO announcement_files (
          announcement_id,
          file_url,
          imagekit_file_id,
          file_name,
          mime_type,
          file_category,
          display_order,
          uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        fileData.announcement_id,
        fileData.file_url,
        fileData.imagekit_file_id,
        fileData.file_name,
        fileData.mime_type,
        fileData.file_category,
        fileData.display_order || 0,
        fileData.uploaded_by,
      ];
      
      const result = await client.query(query, values);
      createdFiles.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    return createdFiles;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
