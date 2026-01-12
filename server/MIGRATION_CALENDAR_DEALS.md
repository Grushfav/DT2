# Calendar Deals Migration

## Database Migration Required

The calendar deals feature requires a new database table. Run this SQL in your Supabase SQL Editor:

```sql
-- Calendar Deals (for TravelPulse calendar)
CREATE TABLE IF NOT EXISTS calendar_deals (
  id BIGSERIAL PRIMARY KEY,
  deal_date DATE NOT NULL UNIQUE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'package', 'visa')),
  title TEXT,
  description TEXT,
  discount_percent INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for calendar deals
CREATE INDEX IF NOT EXISTS idx_calendar_deals_date ON calendar_deals(deal_date);
CREATE INDEX IF NOT EXISTS idx_calendar_deals_active ON calendar_deals(active, deal_date);

-- Enable RLS for calendar deals
ALTER TABLE calendar_deals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read active deals
CREATE POLICY "Allow public read access to active calendar deals" ON calendar_deals
  FOR SELECT USING (active = true);

-- Add trigger for updated_at on calendar_deals
CREATE TRIGGER update_calendar_deals_updated_at
  BEFORE UPDATE ON calendar_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Features

1. **Calendar Display**: Shows current month with actual dates
2. **Deal Assignment**: Admins can assign deal types (Flight, Hotel, Package, Visa) to specific dates
3. **Admin Panel**: New section in admin.html to manage calendar deals
4. **Visual Indicators**: Days with deals are color-coded by type
5. **Today Highlight**: Current date is highlighted

## Usage

1. **Admin**: Go to admin panel → "Calendar Deals Management"
2. Select a date and deal type
3. Optionally add title, description, and discount percentage
4. Save the deal
5. The deal will appear on the calendar for that date

## API Endpoints

- `GET /api/calendar-deals` - Get active deals (public)
- `GET /api/calendar-deals/all` - Get all deals (admin only)
- `POST /api/calendar-deals` - Create/update a deal (admin only)
- `DELETE /api/calendar-deals/:id` - Delete a deal (admin only)

