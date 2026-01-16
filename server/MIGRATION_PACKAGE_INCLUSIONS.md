# Migration: Add Package Inclusions

This migration adds an `inclusions` JSONB column to the `packages` table to store which services are included in each package (Flights, Hotel, Meal, Vehicle).

## SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add inclusions column to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '{"flights": true, "hotel": true, "meal": false, "vehicle": false}'::jsonb;

-- Update existing packages to have default inclusions (Flights + Hotel)
UPDATE packages 
SET inclusions = '{"flights": true, "hotel": true, "meal": false, "vehicle": false}'::jsonb
WHERE inclusions IS NULL;
```

## What This Does

- Adds an `inclusions` JSONB column to store package inclusions
- Default value is `{"flights": true, "hotel": true, "meal": false, "vehicle": false}` (Flights + Hotel)
- Updates existing packages to have the default inclusions

## Usage

After running this migration, admins can select which services are included when creating/editing packages:
- ✈️ Flights
- 🏨 Hotel (default: checked)
- 🍽️ Meal
- 🚗 Vehicle

The admin dashboard will show checkboxes for these options, and the data will be stored in the `inclusions` JSONB field.

