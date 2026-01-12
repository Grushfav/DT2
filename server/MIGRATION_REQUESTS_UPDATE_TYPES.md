# Migration: Update Requests Table to Include Passport and Visa Types

If you already ran the initial MIGRATION_REQUESTS.md, run this SQL to add passport and visa request types.

```sql
-- Update the CHECK constraint to include passport and visa types
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_request_type_check;

ALTER TABLE requests 
ADD CONSTRAINT requests_request_type_check 
CHECK (request_type IN ('booking', 'package', 'travel_plan', 'travel_buddy', 'passport', 'visa'));
```

## Notes:
- This updates the existing requests table to allow 'passport' and 'visa' as valid request types
- If you haven't run the initial migration yet, just update MIGRATION_REQUESTS.md and run that instead

