# Migration: Add First Name and Last Name to Users Table

Run this SQL in your Supabase SQL Editor to add first_name and last_name columns to the users table.

```sql
-- Add first_name and last_name columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data: Split name into first_name and last_name
-- This assumes names are in "First Last" format
UPDATE users 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN 
      SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
```

## Notes:
- Existing users will have their `name` field split into `first_name` and `last_name`
- The `name` field is kept for backward compatibility
- New registrations should use `first_name` and `last_name` fields

