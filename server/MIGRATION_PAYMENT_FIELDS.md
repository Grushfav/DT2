# Migration: Add Payment Fields to Requests Table

Run this SQL in your Supabase SQL Editor to add payment tracking fields to the `requests` table.

```sql
-- Add payment tracking columns to requests table
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'awaiting_payment', 'payment_received', 'payment_confirmed', 'no_payment_required')),
  ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT '{}'::jsonb, -- Store payment instructions, amount, method, etc.
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_requests_payment_status ON requests(payment_status, status);

-- Add comment for documentation
COMMENT ON COLUMN requests.payment_status IS 'Payment status: pending (no payment needed yet), awaiting_payment (payment info sent), payment_received (user claims payment made), payment_confirmed (admin confirmed), no_payment_required';
COMMENT ON COLUMN requests.payment_info IS 'JSON object containing payment instructions, amount, account details, etc.';
```

## Payment Status Flow:
1. **pending** - Initial state, no payment needed yet
2. **awaiting_payment** - Admin has sent payment instructions, waiting for user to pay
3. **payment_received** - User has indicated they made payment (optional user action)
4. **payment_confirmed** - Admin has confirmed payment was received
5. **no_payment_required** - This request doesn't require payment

## Payment Info Structure (JSONB):
```json
{
  "amount": "500.00",
  "currency": "USD",
  "payment_method": "bank_transfer",
  "account_name": "BT2 Horizon",
  "account_number": "1234567890",
  "bank_name": "Bank of Jamaica",
  "instructions": "Please include request ID in payment reference",
  "due_date": "2024-02-15"
}
```

