# Bank Details Update Guide

## Overview

This guide explains how to update the bank account details displayed in the BT2 Horizon frontend.

## Current Bank Accounts

The following bank accounts are configured:

1. **JMMB Transfer/Deposit JMD**
   - Bank: JMMB Bank
   - Account Name: Bookings Transport & Travel
   - Type: Checking
   - Account Number: 00030246492
   - Branch: Knutsford Blvd
   - Currency: JMD

2. **JMMB Transfer/Deposit USD**
   - Bank: JMMB Bank
   - Account Name: Bookings Transport & Travel
   - Type: Checking
   - Account Number: 000300246493
   - Branch: Knutsford Blvd
   - Currency: USD

3. **NCB Transfer/Deposit JMD**
   - Bank: National Commercial Bank (NCB)
   - Account Name: Bookings Transport & Travel
   - Type: Savings
   - Account Number: 354881616
   - Branch: New Kingston
   - Currency: JMD

4. **NCB Transfer/Deposit USD**
   - Bank: National Commercial Bank (NCB)
   - Account Name: Bookings Transport & Travel
   - Type: Savings
   - Account Number: 354881624
   - Branch: New Kingston
   - Currency: USD

## Other Payment Methods

We also accept:
- PayPal
- Cash App
- Zelle

(Contact us for more details)

---

## How to Update Bank Details

### Option 1: Using SQL Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Update Script**
   - Open `server/UPDATE_BANK_DETAILS.sql`
   - Copy and paste the entire SQL script
   - Click "Run" to execute

3. **Verify**
   - The script will:
     - Deactivate old bank details
     - Insert the 4 new bank accounts
     - Set them all as active

### Option 2: Using Admin Panel

1. **Access Admin Panel**
   - Go to `https://your-backend-url.onrender.com/admin.html`
   - Login with admin credentials

2. **Navigate to Bank Details Section**
   - Find the "Bank Details" section in the admin panel
   - View existing bank details

3. **Update Each Account**
   - Click "Edit" on each bank account
   - Update the fields:
     - Bank Name
     - Account Name
     - Account Number
     - Branch Name
     - Currency
     - Instructions
   - Click "Save"

4. **Add New Accounts** (if needed)
   - Click "Add New Bank Detail"
   - Fill in all required fields
   - Set as "Active"
   - Click "Save"

### Option 3: Using API Directly

You can use the API endpoints directly:

**Get all bank details:**
```bash
GET /api/bank-details
```

**Create new bank detail (Admin only):**
```bash
POST /api/bank-details
Headers: x-admin-key: your-admin-key
Body: {
  "bank_name": "JMMB Bank",
  "account_name": "Bookings Transport & Travel",
  "account_number": "00030246492",
  "branch_name": "Knutsford Blvd",
  "currency": "JMD",
  "instructions": "Type: Checking Account. Please include your Request ID...",
  "active": true
}
```

**Update existing bank detail (Admin only):**
```bash
PUT /api/bank-details/:id
Headers: x-admin-key: your-admin-key
Body: {
  "account_number": "new-account-number",
  ...
}
```

---

## Database Schema

The `bank_details` table has the following structure:

```sql
CREATE TABLE bank_details (
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
```

---

## Frontend Display

The bank details are displayed in:
- **Component:** `src/components/BankDetails.jsx`
- **Access:** Click "Bank Details" button in the navigation menu
- **Features:**
  - Copy-to-clipboard functionality for account numbers
  - Currency badges
  - Branch information
  - Payment instructions
  - Other payment methods (PayPal, Cash App, Zelle)

---

## Important Notes

1. **Only Active Accounts Show**
   - Only bank details with `active = true` are displayed
   - To hide an account, set `active = false`

2. **Request ID Reference**
   - Users are reminded to include their Request ID in payment references
   - This helps match payments to requests

3. **Currency Display**
   - Each account shows its currency (JMD or USD)
   - Currency is displayed as a badge

4. **Other Payment Methods**
   - PayPal, Cash App, and Zelle are mentioned
   - Users are directed to contact for more details

---

## Troubleshooting

### Bank Details Not Showing

1. **Check Database**
   - Verify `bank_details` table exists
   - Run migration: `server/MIGRATION_BANK_DETAILS.md`

2. **Check Active Status**
   - Ensure accounts have `active = true`
   - Query: `SELECT * FROM bank_details WHERE active = true;`

3. **Check API**
   - Test endpoint: `GET /api/bank-details`
   - Should return JSON array of active bank details

4. **Check Frontend**
   - Verify `VITE_API_BASE` environment variable is set
   - Check browser console for errors

---

## Files Modified

- `server/UPDATE_BANK_DETAILS.sql` - SQL script to update bank details
- `src/components/BankDetails.jsx` - Frontend component (added other payment methods note)
- `server/BANK_DETAILS_UPDATE_GUIDE.md` - This guide

---

## Next Steps

1. ✅ Run `server/UPDATE_BANK_DETAILS.sql` in Supabase
2. ✅ Verify bank details appear in frontend
3. ✅ Test copy-to-clipboard functionality
4. ✅ Confirm all 4 accounts are visible
5. ✅ Verify "Other Payment Methods" section displays correctly

