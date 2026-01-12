# Migration: Add Trip Details to Packages Table

Run this SQL in your Supabase SQL Editor to add trip_details field to the packages table.

```sql
-- Add trip_details column to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS trip_details TEXT;

-- Create index for full-text search if needed (optional)
-- CREATE INDEX IF NOT EXISTS idx_packages_trip_details ON packages USING gin(to_tsvector('english', trip_details));
```

## Notes:
- The `trip_details` field stores detailed information about the trip/package
- This can include itinerary, inclusions, exclusions, important notes, etc.
- Admins can add/edit trip details from the admin panel
- Users will see trip details when clicking "View Details" on a package

