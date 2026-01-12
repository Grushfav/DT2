-- Migration: Add images column to packages table
-- Run this SQL in your Supabase SQL Editor if the images column doesn't exist

-- Add images column if it doesn't exist
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Update existing packages to have images array from img field
UPDATE packages 
SET images = CASE 
  WHEN img IS NOT NULL AND img != '' THEN jsonb_build_array(img)
  ELSE '[]'::jsonb
END
WHERE images IS NULL OR images = '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'packages' AND column_name = 'images';

