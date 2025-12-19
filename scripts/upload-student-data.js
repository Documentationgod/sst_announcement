const path = require('path');
const fs = require('fs');

const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '.env.development'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📄 Loaded environment from: ${envPath}`);
    break;
  }
}

require('dotenv').config();

const { Pool } = require('pg');

const TABLES = ['2027', '2028A', '2028B', '2029A', '2029B', '2029C'];

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required. Make sure your .env file is set up.');
  }
  
  return new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(filePath, tableName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return [];
    }
    
    const tablesWithBatch = ['2028A', '2028B', '2029A', '2029B', '2029C'];
    const hasBatch = tablesWithBatch.includes(tableName);
    
    const header = parseCSVLine(lines[0]);
    const nameIndex = header.findIndex(h => h.toLowerCase().includes('name'));
    const sstEmailIndex = header.findIndex(h => h.toLowerCase().includes('sst') && h.toLowerCase().includes('email'));
    const batchIndex = hasBatch ? header.findIndex(h => h.toLowerCase().includes('batch')) : -1;
    
    if (nameIndex === -1) {
      console.warn(`⚠️  Warning: Could not find 'Name' column in ${filePath}`);
      return [];
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values[nameIndex] && values[nameIndex].trim()) {
        const studentData = {
          name: values[nameIndex].trim(),
          sstEmail: sstEmailIndex !== -1 && values[sstEmailIndex] ? values[sstEmailIndex].trim() : null,
        };
        
        if (hasBatch && batchIndex !== -1) {
          studentData.batch = values[batchIndex] ? values[batchIndex].trim() : null;
        }
        
        data.push(studentData);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error parsing CSV file ${filePath}:`, error.message);
    return [];
  }
}

async function createTables() {
  const pool = getPool();
  
  try {
    console.log('🚀 Starting table creation...\n');
    
    const tablesWithBatch = ['2028A', '2028B', '2029A', '2029B', '2029C'];
    
    for (const tableName of TABLES) {
      const escapedTableName = `"${tableName}"`;
      
      let createTableQuery;
      
      if (tablesWithBatch.includes(tableName)) {
        createTableQuery = `
          CREATE TABLE IF NOT EXISTS ${escapedTableName} (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            sst_email TEXT,
            batch TEXT
          );
        `;
      } else {
        createTableQuery = `
          CREATE TABLE IF NOT EXISTS ${escapedTableName} (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            sst_email TEXT,
            ms_email TEXT
          );
        `;
      }
      
      await pool.query(createTableQuery);
      console.log(`✅ Table ${tableName} created successfully`);
      
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${escapedTableName}(name);
      `;
      
      await pool.query(createIndexQuery);
      console.log(`   └─ Index created for ${tableName}\n`);
    }
    
    console.log('✨ All tables created successfully!\n');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function insertData(tableName, data) {
  const pool = getPool();
  const escapedTableName = `"${tableName}"`;
  
  const tablesWithBatch = ['2028A', '2028B', '2029A', '2029B', '2029C'];
  const hasBatch = tablesWithBatch.includes(tableName);
  
  try {
    if (data.length === 0) {
      console.log(`⚠️  No data to insert for table ${tableName}`);
      return;
    }
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const student of data) {
      const checkQuery = `
        SELECT id FROM ${escapedTableName}
        WHERE LOWER(sst_email) = LOWER($1)
        LIMIT 1;
      `;
      
      const existing = await pool.query(checkQuery, [student.sstEmail || '']);
      
      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }
      
      let insertQuery;
      let values;
      
      if (hasBatch) {
        insertQuery = `
          INSERT INTO ${escapedTableName} (name, sst_email, batch)
          VALUES ($1, $2, $3);
        `;
        values = [
          student.name,
          student.sstEmail || null,
          student.batch || null,
        ];
      } else {
        insertQuery = `
          INSERT INTO ${escapedTableName} (name, sst_email, ms_email)
          VALUES ($1, $2, $3);
        `;
        values = [
          student.name,
          student.sstEmail || null,
          null,
        ];
      }
      
      await pool.query(insertQuery, values);
      insertedCount++;
    }
    
    console.log(`✅ Table ${tableName}: Inserted ${insertedCount} new record(s), skipped ${skippedCount} existing record(s)`);
  } catch (error) {
    console.error(`❌ Error inserting data into ${tableName}:`, error);
    throw error;
  }
}

async function uploadData(dataByTable) {
  const pool = getPool();
  
  try {
    console.log('📤 Starting data upload...\n');
    
    for (const tableName of TABLES) {
      const data = dataByTable[tableName] || [];
      if (data.length > 0) {
        await insertData(tableName, data);
      } else {
        console.log(`⚠️  No data provided for table ${tableName}`);
      }
    }
    
    console.log('\n✨ Data upload completed!');
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function loadDataFromCSV() {
  const dataDir = path.join(__dirname, '..', 'data');
  const dataByTable = {};
  
  const csvFileMap = {
    '2027': ['2027.csv'],
    '2028A': ['2028A.csv'],
    '2028B': ['2028B.csv'],
    '2029A': ['2029A.csv'],
    '2029B': ['2029B.csv'],
    '2029C': ['2029C.csv'],
  };
  
  if (!fs.existsSync(dataDir)) {
    console.log(`⚠️  Data directory not found: ${dataDir}`);
    return dataByTable;
  }
  
  for (const [tableName, possibleFiles] of Object.entries(csvFileMap)) {
    for (const fileName of possibleFiles) {
      const filePath = path.join(dataDir, fileName);
      if (fs.existsSync(filePath)) {
        console.log(`📂 Found CSV file for ${tableName}: ${fileName}`);
        const data = parseCSV(filePath, tableName);
        if (data.length > 0) {
          dataByTable[tableName] = data;
          console.log(`   └─ Loaded ${data.length} record(s) from ${fileName}`);
        }
        break;
      }
    }
  }
  
  return dataByTable;
}

async function main() {
  const pool = getPool();
  
  try {
    await createTables();
    
    console.log('📂 Looking for CSV files in data directory...\n');
    const dataByTable = loadDataFromCSV();
    
    const hasData = Object.values(dataByTable).some(data => data.length > 0);
    if (hasData) {
      await uploadData(dataByTable);
    } else {
      console.log('\n💡 No CSV files found. Tables are ready for data insertion.');
      console.log('   Place CSV files in the data/ directory with names like:');
      console.log('   - Copy of Student Data - Batch 2027.csv');
      console.log('   - Copy of Student Data - 2028A.csv');
      console.log('   - Copy of Student Data - 2028B.csv');
      console.log('   - Copy of Student Data - 2029A.csv');
      console.log('   - Copy of Student Data - 2029B.csv');
      console.log('   - Copy of Student Data - 2029C.csv');
    }
    
  } catch (error) {
    console.error('\n💥 Failed to update database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('\n🎉 Database update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to update database:', error);
    process.exit(1);
  });

