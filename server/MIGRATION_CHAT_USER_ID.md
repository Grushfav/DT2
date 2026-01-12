# Migration: Add user_id to chat_messages table

This migration adds a `user_id` column to the `chat_messages` table to link messages to logged-in users.

## Run this SQL in your Supabase SQL Editor:

```sql
-- Add user_id column to chat_messages table
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Update existing messages to use user_id if sender_email matches a user
UPDATE chat_messages cm
SET user_id = u.id
FROM users u
WHERE cm.sender_email = u.email
  AND cm.user_id IS NULL;
```

## What this does:

1. Adds `user_id` column that references the `users` table
2. Creates an index for faster queries by user
3. Optionally links existing messages to users based on email match

## After running:

- New chat messages from logged-in users will automatically be linked to their user account
- The admin panel can see which messages are from registered users vs guests
- Users can see their chat history when logged in

