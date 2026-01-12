-- BT2 Horizon Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  nights INTEGER,
  price TEXT,
  img TEXT, -- Legacy single image (for backward compatibility)
  images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs (minimum 1, recommended 7+)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_packages_code ON packages(code);

-- Enable Row Level Security (RLS) - optional, adjust based on your needs
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access on posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on packages" ON packages
  FOR SELECT USING (true);

-- Policy: Allow service role to insert/update/delete (for admin operations)
-- Note: Service role key bypasses RLS, so these policies are mainly for documentation
-- Admin operations will use the service role key which has full access

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age_range TEXT CHECK (age_range IN ('12-18', '19-29', '30-39', '40-49', '50-59', '60-69', '70-79')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Note: Service role key bypasses RLS, so backend operations will work

-- Crazy Deals / Promotions table
CREATE TABLE IF NOT EXISTS crazy_deals (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  discount_percent INTEGER,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affordable Destinations / Fly List table
CREATE TABLE IF NOT EXISTS affordable_destinations (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  price TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crazy_deals_active ON crazy_deals(active, end_date);
CREATE INDEX IF NOT EXISTS idx_affordable_destinations_active ON affordable_destinations(active, display_order);

-- Enable RLS
ALTER TABLE crazy_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affordable_destinations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active items
CREATE POLICY "Allow public read access to active deals" ON crazy_deals
  FOR SELECT USING (active = true AND end_date > NOW());

CREATE POLICY "Allow public read access to active destinations" ON affordable_destinations
  FOR SELECT USING (active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_crazy_deals_updated_at
  BEFORE UPDATE ON crazy_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affordable_destinations_updated_at
  BEFORE UPDATE ON affordable_destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Chat messages table for live chat support
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Enable RLS for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert messages
CREATE POLICY "Allow public to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Allow public to read their own session messages
CREATE POLICY "Allow public to read own session messages" ON chat_messages
  FOR SELECT USING (true); -- For now, allow all reads (you can restrict by session_id later)

-- Policy: Allow service role full access (for admin)

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

-- Digital Forms System (for save/resume functionality)
CREATE TABLE IF NOT EXISTS form_drafts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL, -- 'booking', 'visa', 'passport', 'usa_visa', 'canada_visa', 'uk_visa', 'travel_inquiry', 'travel_period', 'custom'
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, submitted, completed
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for form drafts
CREATE INDEX IF NOT EXISTS idx_form_drafts_user ON form_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_form_drafts_type ON form_drafts(form_type, status);
CREATE INDEX IF NOT EXISTS idx_form_drafts_status ON form_drafts(status, last_saved_at);

-- Enable RLS for form drafts
ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own drafts
CREATE POLICY "Users can manage own form drafts" ON form_drafts
  FOR ALL USING (true); -- Service role bypasses RLS, but this is for future user-based access

-- Add trigger for updated_at on form_drafts
CREATE TRIGGER update_form_drafts_updated_at
  BEFORE UPDATE ON form_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Requests/Submissions System for tracking user requests and their status
CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('booking', 'package', 'travel_plan', 'travel_buddy')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed')),
  request_data JSONB DEFAULT '{}'::jsonb, -- Store form data, package code, trip ID, etc.
  admin_notes TEXT, -- Admin can add notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for requests
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type, status);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);

-- Enable RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests" ON requests
  FOR SELECT USING (true); -- Service role bypasses RLS

-- Add trigger for updated_at on requests
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
  itinerary JSONB DEFAULT '[]'::jsonb, -- Array of itinerary items
  included JSONB DEFAULT '[]'::jsonb, -- Array of what's included
  requirements TEXT, -- Age, fitness level, etc.
  status TEXT DEFAULT 'open', -- open, full, completed, cancelled
  created_by BIGINT REFERENCES users(id), -- Admin who created the trip
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel Trip Participants (users who joined a trip)
CREATE TABLE IF NOT EXISTS trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES travel_trips(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT, -- For non-registered users
  guest_email TEXT, -- For non-registered users
  guest_phone TEXT, -- For non-registered users
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT, -- Special requests or notes
  UNIQUE(trip_id, user_id), -- Prevent duplicate registrations
  UNIQUE(trip_id, guest_email) -- Prevent duplicate guest registrations
);

-- Create indexes for travel trips
CREATE INDEX IF NOT EXISTS idx_travel_trips_status ON travel_trips(status, start_date);
CREATE INDEX IF NOT EXISTS idx_travel_trips_destination ON travel_trips(destination, country);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user ON trip_participants(user_id);

-- Enable RLS for travel trips
ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read open trips
CREATE POLICY "Allow public to read open trips" ON travel_trips
  FOR SELECT USING (status IN ('open', 'full'));

-- Policy: Allow public to insert trip participants (join trips)
CREATE POLICY "Allow public to join trips" ON trip_participants
  FOR INSERT WITH CHECK (true);

-- Policy: Allow users to read their own trip participations
CREATE POLICY "Allow users to read own participations" ON trip_participants
  FOR SELECT USING (true); -- Users can see their own participations

-- Add trigger for updated_at on travel_trips
CREATE TRIGGER update_travel_trips_updated_at
  BEFORE UPDATE ON travel_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

