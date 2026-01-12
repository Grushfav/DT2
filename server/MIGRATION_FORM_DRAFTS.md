# Migration: Form Drafts Table

This migration creates the `form_drafts` table for saving and resuming digital forms.

## SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Digital Forms System (for save/resume functionality)
CREATE TABLE IF NOT EXISTS form_drafts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL, -- 'booking', 'visa', 'travel_inquiry', 'travel_period', 'custom'
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
```

## Form Types

The system supports the following form types:
- `booking` - Booking inquiry form (LeadModal)
- `travel_period` - Travel period submission form (TravelPulse)
- `passport` - Passport application form (PassportForm)
- `usa_visa` - USA Visa (DS-160) application form (USAVisaForm)
- `canada_visa` - Canada Visitor Visa application form (CanadaVisaForm)
- `uk_visa` - UK Standard Visitor Visa application form (UKVisaForm)
- `visa` - Generic visa application form (future)
- `travel_inquiry` - General travel inquiry (future)
- `custom` - Custom form types (future)

## Features

1. **Save Progress**: Users can save their form progress at any time
2. **Resume Later**: Users can resume incomplete forms from their saved drafts
3. **Auto-save**: Forms auto-save every 30 seconds (for logged-in users)
4. **Progress Tracking**: Shows completion percentage for each form
5. **Form History**: Users can view all their saved and submitted forms

## API Endpoints

- `GET /api/form-drafts` - Get all drafts (filtered by userId, formType, status)
- `GET /api/form-drafts/:id` - Get a specific draft
- `POST /api/form-drafts` - Create a new draft
- `PUT /api/form-drafts/:id` - Update an existing draft
- `DELETE /api/form-drafts/:id` - Delete a draft

