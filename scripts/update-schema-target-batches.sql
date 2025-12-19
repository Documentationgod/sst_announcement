-- Migration: Add targetBatches field to announcement_targets table
-- This allows storing multiple batch targets as JSON array

-- Add the target_batches column to announcement_targets
ALTER TABLE announcement_targets 
  ADD COLUMN IF NOT EXISTS target_batches TEXT;

-- Add comment for documentation
COMMENT ON COLUMN announcement_targets.target_batches IS 'JSON string array of target batches (e.g., ["24A", "25B"])';

-- Create student data tables for batch management
CREATE TABLE IF NOT EXISTS "2027" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  ms_email TEXT
);

CREATE TABLE IF NOT EXISTS "2028A" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  batch TEXT
);

CREATE TABLE IF NOT EXISTS "2028B" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  batch TEXT
);

CREATE TABLE IF NOT EXISTS "2029A" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  batch TEXT
);

CREATE TABLE IF NOT EXISTS "2029B" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  batch TEXT
);

CREATE TABLE IF NOT EXISTS "2029C" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sst_email TEXT,
  batch TEXT
);

-- Create indexes for student name searches
CREATE INDEX IF NOT EXISTS idx_2027_name ON "2027"(name);
CREATE INDEX IF NOT EXISTS idx_2028A_name ON "2028A"(name);
CREATE INDEX IF NOT EXISTS idx_2028B_name ON "2028B"(name);
CREATE INDEX IF NOT EXISTS idx_2029A_name ON "2029A"(name);
CREATE INDEX IF NOT EXISTS idx_2029B_name ON "2029B"(name);
CREATE INDEX IF NOT EXISTS idx_2029C_name ON "2029C"(name);

-- Add comments
COMMENT ON TABLE "2027" IS 'Student data for batch 2027';
COMMENT ON TABLE "2028A" IS 'Student data for batch 2028A';
COMMENT ON TABLE "2028B" IS 'Student data for batch 2028B';
COMMENT ON TABLE "2029A" IS 'Student data for batch 2029A';
COMMENT ON TABLE "2029B" IS 'Student data for batch 2029B';
COMMENT ON TABLE "2029C" IS 'Student data for batch 2029C';
