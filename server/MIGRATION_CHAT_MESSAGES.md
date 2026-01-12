# Chat Messages Table Migration

## Error
If you're seeing this error:
```
Could not find the table 'public.chat_messages' in the schema cache
```

It means the `chat_messages` table hasn't been created in your Supabase database yet.

## Solution

Run this SQL in your Supabase SQL Editor:

```sql
-- Chat messages table for live chat support
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Enable RLS for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert messages
CREATE POLICY "Allow public to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Allow public to read their own session messages
CREATE POLICY "Allow public to read own session messages" ON chat_messages
  FOR SELECT USING (true); -- For now, allow all reads (you can restrict by session_id later)

-- Note: Service role key bypasses RLS, so admin operations will work
```

## Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Run the SQL**
   - Copy the SQL above
   - Paste it into the SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify**
   - Check the "Table Editor" to see if `chat_messages` table exists
   - Try using the live chat feature again

4. **Restart Backend** (if needed)
   - The backend should automatically detect the new table
   - If errors persist, restart your backend server

## After Migration

Once the table is created:
- Users can send chat messages
- Admins can reply via the admin panel
- Notifications will work for users
- Real-time updates via Socket.IO will function

