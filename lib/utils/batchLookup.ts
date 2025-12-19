import { getPool } from '../config/db';
import { getIntakeYearFromEmail, extractBatchFromEmail, getBatchCodeFromEmail } from '@/utils/studentYear';

function getBatchYearFromCode(batchCode: number): number | null {
  if (batchCode === 23) return 2027;
  if (batchCode === 24) return 2028;
  if (batchCode === 25) return 2029;
  return null;
}

function getBatchYearFromEmail(email: string): number | null {
  const batchCode = getBatchCodeFromEmail(email);
  if (batchCode === null) return null;
  return getBatchYearFromCode(batchCode);
}

function getBatchTableNames(year: number): string[] {
  if (year === 2027) {
    return ['2027'];
  } else if (year === 2028) {
    return ['2028A', '2028B'];
  } else if (year === 2029) {
    return ['2029A', '2029B', '2029C'];
  }
  return [];
}

async function searchBatchTables(email: string): Promise<{ tableName: string; batch: string } | null> {
  const pool = getPool();
  const batchYear = getBatchYearFromEmail(email);
  
  if (!batchYear) {
    return null;
  }
  
  const tableNames = getBatchTableNames(batchYear);
  
  for (const tableName of tableNames) {
    try {
      const escapedTableName = `"${tableName}"`;
      
      const is2027 = tableName === '2027';
      
      const query = `
        SELECT sst_email${is2027 ? ', ms_email' : ', batch'}
        FROM ${escapedTableName}
        WHERE LOWER(sst_email) = LOWER($1)
        LIMIT 1;
      `;
      
      const result = await pool.query(query, [email]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        
        let batch: string | null = null;
        
        if (is2027) {
          batch = extractBatchFromEmail(email);
        } else {
          batch = row.batch || null;
          
          if (!batch) {
            batch = extractBatchFromEmail(email);
          }
        }
        
        if (batch) {
          return { tableName, batch };
        }
      }
      
      if (is2027) {
        const msQuery = `
          SELECT ms_email
          FROM ${escapedTableName}
          WHERE LOWER(ms_email) = LOWER($1)
          LIMIT 1;
        `;
        
        const msResult = await pool.query(msQuery, [email]);
        
        if (msResult.rows.length > 0) {
          const batch = extractBatchFromEmail(email);
          if (batch) {
            return { tableName, batch };
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

function getFullBatch(batchFromTable: string | null, email: string): string | null {
  // Use extractBatchFromEmail as the base - it handles the email parsing correctly
  const extractedBatch = extractBatchFromEmail(email);
  if (!extractedBatch) return null;
  
  // If we have batch info from table, prefer it but merge with extracted batch
  if (batchFromTable) {
    const letterMatch = batchFromTable.match(/([A-Z])$/i);
    const letter = letterMatch?.[1]?.toUpperCase();
    
    if (letter) {
      // Use the batch code from extracted batch and letter from table
      const batchCode = extractedBatch.match(/^(\d{2})/)?.[1];
      if (batchCode) {
        return `${batchCode}${letter}`;
      }
    }
    
    // If table batch is already in correct format (e.g., "24A"), use it
    if (/^\d{2}[A-Z]$/.test(batchFromTable)) {
      return batchFromTable;
    }
  }
  
  // Fall back to extracted batch from email
  return extractedBatch;
}

function getFullBatchFromEmail(email: string): string | null {
  // Reuse the extractBatchFromEmail function which already handles this logic
  return extractBatchFromEmail(email);
}

export async function updateUserBatchFromEmail(userId: number, email: string): Promise<string | null> {
  const pool = getPool();
  
  try {
    const batchInfo = await searchBatchTables(email);
    
    let fullBatch: string | null = null;
    
    if (batchInfo) {
      fullBatch = getFullBatch(batchInfo.batch, email);
    } else {
      fullBatch = getFullBatchFromEmail(email);
    }
    
    if (fullBatch) {
      const updateQuery = `
        UPDATE users
        SET batch = $1
        WHERE id = $2
        RETURNING batch;
      `;
      
      const result = await pool.query(updateQuery, [fullBatch, userId]);
      
      if (result.rows.length > 0) {
        return fullBatch;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function getBatchFromEmail(email: string): Promise<string | null> {
  const batchInfo = await searchBatchTables(email);
  
  if (batchInfo) {
    return getFullBatch(batchInfo.batch, email);
  }
  
  return getFullBatchFromEmail(email);
}

