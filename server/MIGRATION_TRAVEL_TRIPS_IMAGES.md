# Migration: Add Multiple Images Support to Travel Buddy Trips

Run this SQL in your Supabase SQL Editor to add multiple images support to the `travel_trips` table.

```sql
-- Add images column for multiple images (similar to packages)
ALTER TABLE travel_trips 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Keep image_url for backward compatibility (it will be set to the first image)
-- No need to drop image_url column as it's still useful for legacy support
```

## Notes:
- The `images` field stores an array of image URLs (similar to packages)
- The `image_url` field is kept for backward compatibility
- When creating/updating trips, `image_url` will be automatically set to the first image in the `images` array
- Minimum 1 image is required (recommended 3+)

