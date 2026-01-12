# Travel Buddy Database Migration

## Important: Run This Migration First!

The Travel Buddy feature requires new database tables. You **must** run the migration before using the feature.

## Steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Migration**
   - Open `server/schema.sql` in your project
   - Copy the Travel Buddy section (starting from `-- Travel Buddy Feature: Travel Trips`)
   - Paste and run it in the Supabase SQL Editor

   OR

   - Copy and run this SQL:

```sql
-- Travel Buddy Feature: Travel Trips
CREATE TABLE IF NOT EXISTS travel_trips (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  price_per_person TEXT,
  image_url TEXT,
  itinerary JSONB DEFAULT '[]'::jsonb,
  included JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  status TEXT DEFAULT 'open',
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES travel_trips(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  status TEXT DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(trip_id, user_id),
  UNIQUE(trip_id, guest_email)
);

CREATE INDEX IF NOT EXISTS idx_travel_trips_status ON travel_trips(status, start_date);
CREATE INDEX IF NOT EXISTS idx_travel_trips_destination ON travel_trips(destination, country);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user ON trip_participants(user_id);

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read open trips" ON travel_trips
  FOR SELECT USING (status IN ('open', 'full'));

CREATE POLICY "Allow public to join trips" ON trip_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read own participations" ON trip_participants
  FOR SELECT USING (true);

CREATE TRIGGER update_travel_trips_updated_at
  BEFORE UPDATE ON travel_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Restart Your Backend Server**
   ```bash
   cd server
   pnpm start
   ```

4. **Verify**
   - Try accessing `/api/travel-trips` - it should return an empty array `[]` instead of 404
   - Create a test trip via the admin panel

## Troubleshooting

- **404 Error**: Make sure you restarted the backend server after adding the routes
- **500 Error**: The database tables don't exist - run the migration above
- **Empty Array**: This is normal if no trips exist yet - create one via admin panel

