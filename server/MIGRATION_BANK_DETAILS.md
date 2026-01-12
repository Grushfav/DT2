# Migration: Add Bank Details Table

Run this SQL in your Supabase SQL Editor to create a table for storing BT2 bank account details.

```sql
-- Bank Details table (stores BT2 company bank account information)
CREATE TABLE IF NOT EXISTS bank_details (
  id BIGSERIAL PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  branch_name TEXT,
  branch_address TEXT,
  currency TEXT DEFAULT 'USD',
  instructions TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_bank_details_active ON bank_details(active);

-- Enable RLS
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (logged-in users can view)
CREATE POLICY "Allow public read access on bank_details" ON bank_details
  FOR SELECT USING (active = true);

-- Note: Service role key bypasses RLS, so admin operations will work

-- Add trigger to update updated_at automatically
CREATE TRIGGER update_bank_details_updated_at
  BEFORE UPDATE ON bank_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default bank details (update with your actual bank information)
INSERT INTO bank_details (
  bank_name,
  account_name,
  account_number,
  routing_number,
  swift_code,
  branch_name,
  currency,
  instructions,
  active
) VALUES (
  'Bank of Jamaica',
  'BT2 Horizon Travel Services',
  '1234567890',
  '123456789',
  'BOJMJMKN',
  'Kingston Main Branch',
  'JMD',
  'Please include your Request ID in the payment reference when making transfers.',
  true
) ON CONFLICT DO NOTHING;
```

## Usage

After running this migration:
- Admin can update bank details via the API endpoint `/api/bank-details` (PUT)
- Logged-in users can view bank details via `/api/bank-details` (GET)
- The frontend component will display these details for making payments

