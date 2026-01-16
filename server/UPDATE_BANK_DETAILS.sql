-- Update Bank Details for BT2 Horizon
-- Run this SQL in your Supabase SQL Editor to update bank account information

-- First, deactivate any existing bank details
UPDATE bank_details SET active = false WHERE active = true;

-- Insert JMMB Transfer/Deposit JMD
INSERT INTO bank_details (
  bank_name,
  account_name,
  account_number,
  branch_name,
  currency,
  instructions,
  active
) VALUES (
  'JMMB Bank',
  'Bookings Transport & Travel',
  '00030246492',
  'Knutsford Blvd',
  'JMD',
  'Type: Checking Account. Please include your Request ID in the payment reference when making transfers.',
  true
);

-- Insert JMMB Transfer/Deposit USD
INSERT INTO bank_details (
  bank_name,
  account_name,
  account_number,
  branch_name,
  currency,
  instructions,
  active
) VALUES (
  'JMMB Bank',
  'Bookings Transport & Travel',
  '000300246493',
  'Knutsford Blvd',
  'USD',
  'Type: Checking Account. Please include your Request ID in the payment reference when making transfers.',
  true
);

-- Insert NCB Transfer/Deposit JMD
INSERT INTO bank_details (
  bank_name,
  account_name,
  account_number,
  branch_name,
  currency,
  instructions,
  active
) VALUES (
  'National Commercial Bank (NCB)',
  'Bookings Transport & Travel',
  '354881616',
  'New Kingston',
  'JMD',
  'Type: Savings Account. Please include your Request ID in the payment reference when making transfers.',
  true
);

-- Insert NCB Transfer/Deposit USD
INSERT INTO bank_details (
  bank_name,
  account_name,
  account_number,
  branch_name,
  currency,
  instructions,
  active
) VALUES (
  'National Commercial Bank (NCB)',
  'Bookings Transport & Travel',
  '354881624',
  'New Kingston',
  'USD',
  'Type: Savings Account. Please include your Request ID in the payment reference when making transfers.',
  true
);

