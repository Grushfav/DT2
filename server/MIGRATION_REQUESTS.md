# Migration: Add Requests Table

Run this SQL in your Supabase SQL Editor to create the `requests` table for tracking user submissions and requests.

```sql
-- Migration: Add requests table for tracking user submissions and requests
-- Run this SQL in your Supabase SQL Editor

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('booking', 'package', 'travel_plan', 'travel_buddy', 'passport', 'visa')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed')),
  request_data JSONB DEFAULT '{}'::jsonb, -- Store form data, package code, trip ID, etc.
  admin_notes TEXT, -- Admin can add notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type, status);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);

-- Enable RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests (service role bypasses RLS)
-- Note: In production, you may want to add more specific RLS policies
-- For now, the backend handles authorization

-- Add trigger for updated_at
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Notes

- The `requests` table tracks all user submissions including:
  - Booking inquiries (from LeadModal)
  - Package requests (when a package code is provided)
  - Travel plan requests (from TravelPulse)
  - Travel buddy trip requests (when users join trips)
  - Passport applications (from PassportForm)
  - Visa applications (from USAVisaForm, CanadaVisaForm, UKVisaForm)

- Status can be: `pending`, `in_progress`, `on_hold`, `completed`

- `request_data` stores the original form data as JSONB for reference

- Admins can update status and add notes via the admin panel

