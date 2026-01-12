# Quick Fix for Gmail Authentication Error

## The Error
```
535-5.7.8 Username and Password not accepted
```

## ⚡ Quick Fix (Most Likely Solution)

### 1. Generate a FRESH App Password

**Go to:** https://myaccount.google.com/apppasswords

**Steps:**
1. If you see "BT2 Backend" or any existing app password, **DELETE IT**
2. Click "Select app" → Choose **"Mail"**
3. Click "Select device" → Choose **"Other (Custom name)"**
4. Type: **"BT2 Backend"**
5. Click **"Generate"**
6. **Copy the 16-character password** (it will show as: `abcd efgh ijkl mnop`)

### 2. Update .env File

Open `server/.env` and replace the App Password:

```env
GMAIL_USER=gavin.seaton.jm@gmail.com
GMAIL_APP_PASSWORD=your-new-16-char-password-no-spaces
NOTIFICATION_EMAIL=gavin.seaton.jm@gmail.com
```

**CRITICAL:** 
- Remove ALL spaces from the password
- No quotes around the password
- Should be exactly 16 characters (no spaces)

### 3. Verify 2-Step Verification

**Go to:** https://myaccount.google.com/security

- Make sure **"2-Step Verification"** shows as **"On"**
- If it's "Off", click it and complete the setup
- You MUST verify your phone number

### 4. Restart Server

```bash
# Stop server (Ctrl+C)
cd server
pnpm start
```

### 5. Check Console Output

When server starts, you should see:
```
📧 Email configuration:
   User: gavin.seaton.jm@gmail.com
   Password length: 16 characters
   Notification email: gavin.seaton.jm@gmail.com
✅ Email server is ready to send messages
```

If you see ❌ instead, the password is still wrong.

## 🔍 Still Not Working?

### Option A: Try Different Gmail Account
Some accounts have restrictions. Try with a different Gmail account.

### Option B: Check Account Security
1. Go to: https://myaccount.google.com/security
2. Look for any security alerts
3. Make sure account isn't locked
4. Try signing in to Gmail in browser to verify account works

### Option C: Wait and Retry
Sometimes Gmail needs 10-15 minutes to recognize new App Passwords. Wait a bit and try again.

## ✅ Success Indicators

When it works, you'll see:
- Console: `✅ Email server is ready to send messages`
- When form is submitted: `Email sent: <message-id>`
- Email arrives in your inbox

