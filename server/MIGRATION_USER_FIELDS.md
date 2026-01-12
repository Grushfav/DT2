# User Registration Fields Migration

## New Fields Added

The user registration now includes:
- **Phone** (required)
- **Gender** (optional): male, female, other, prefer_not_to_say
- **Age Range** (optional): 12-18, 19-29, 30-39, 40-49, 50-59, 60-69, 70-79
- **Name** is now required (was optional)

## Database Migration

Run this SQL in your Supabase SQL Editor to add the new columns:

```sql
-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS age_range TEXT CHECK (age_range IN ('12-18', '19-29', '30-39', '40-49', '50-59', '60-69', '70-79'));

-- Make name required (update existing NULL values first)
UPDATE users SET name = 'User' WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
```

## What Changed

1. **Database Schema** (`server/schema.sql`):
   - Added `phone`, `gender`, and `age_range` columns
   - Made `name` required (NOT NULL)

2. **Backend API** (`server/index.js`):
   - Updated `/api/auth/register` endpoint to accept new fields
   - Added validation for age_range and gender values
   - Made name required in validation

3. **Frontend** (`src/components/LoginModal.jsx`):
   - Added form fields for phone, gender, and age_range
   - Phone is required, gender and age_range are optional
   - Updated form validation and submission

4. **Auth Context** (`src/contexts/AuthContext.jsx`):
   - Updated `register` function to accept and pass new fields

## Testing

After running the migration:
1. Try registering a new user with all fields
2. Try registering with only required fields (name, email, password, phone)
3. Verify the data is saved correctly in the database

