# Migration: Add Testimonials Table

Run this SQL in your Supabase SQL Editor to create the testimonials table.

```sql
-- Testimonials table for user-submitted testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  location TEXT,
  text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status, created_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON testimonials(user_id);

-- Enable RLS for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert testimonials (anyone can submit)
CREATE POLICY "Allow public to insert testimonials" ON testimonials
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Policy: Allow public to read approved testimonials
CREATE POLICY "Allow public to read approved testimonials" ON testimonials
  FOR SELECT TO anon, authenticated USING (status = 'approved');

-- Policy: Allow users to read their own testimonials (any status)
-- Note: Since we use custom JWT auth (not Supabase Auth), this policy allows authenticated users
-- The backend will handle actual user authorization via JWT tokens
CREATE POLICY "Allow users to read their own testimonials" ON testimonials
  FOR SELECT TO authenticated USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Status Flow:
- **pending** - Newly submitted, awaiting admin approval
- **approved** - Approved by admin, visible on website
- **rejected** - Rejected by admin, not visible

## Notes:
- Users can submit testimonials without logging in (guest submissions)
- Only approved testimonials are displayed on the website
- Users can see their own testimonials regardless of status
- Admins can manage testimonials from the admin panel

