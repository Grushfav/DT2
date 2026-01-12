# Fix Gmail Authentication Error

## Current Error
```
535-5.7.8 Username and Password not accepted
```

## Most Common Causes & Fixes

### 1. App Password is Invalid or Expired
**Solution:** Generate a NEW App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Delete the old "BT2 Backend" app password (if it exists)
3. Create a NEW one:
   - Select "Mail"
   - Select "Other (Custom name)" → Type "BT2 Backend"
   - Click "Generate"
   - Copy the NEW 16-character password
4. Update `.env` with the NEW password (remove all spaces)

### 2. 2-Step Verification Not Properly Enabled
**Solution:** Verify 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Check "2-Step Verification" status
3. If it says "Off" or "Not set up", enable it completely
4. You MUST complete the setup process (verify phone, etc.)
5. After enabling, wait 5 minutes, then generate App Password

### 3. Account Security Restrictions
**Solution:** Check account security

1. Go to: https://myaccount.google.com/security
2. Check for any security alerts
3. Make sure account isn't locked
4. Try signing in to Gmail in a browser to verify account works

### 4. Using Wrong Account Type
**Solution:** Verify account type

- ✅ Personal Gmail account (ends with @gmail.com) - Should work
- ⚠️ Google Workspace account - May have restrictions
- ⚠️ School/Organization account - Often blocked

### 5. Password Format Issues
**Check your .env file:**

```env
# ✅ CORRECT (no spaces, no quotes)
GMAIL_USER=gavin.seaton.jm@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop

# ❌ WRONG (with spaces)
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop

# ❌ WRONG (with quotes)
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

## Quick Fix Checklist

1. [ ] Go to https://myaccount.google.com/apppasswords
2. [ ] Delete old "BT2 Backend" app password
3. [ ] Generate a NEW app password
4. [ ] Copy the NEW password (16 characters)
5. [ ] Update `.env` file - remove ALL spaces from password
6. [ ] Save `.env` file
7. [ ] Restart server (stop with Ctrl+C, then `pnpm start`)
8. [ ] Test by submitting a form

## Test After Fix

1. Submit a booking form on your frontend
2. Check server console - should see: `Email sent: <message-id>`
3. Check your email inbox (and spam folder)

## Still Not Working?

If you've tried all the above and it still fails:

1. **Try a different Gmail account** - Some accounts have restrictions
2. **Wait 10-15 minutes** - Gmail sometimes needs time to recognize new App Passwords
3. **Check Gmail security page** - Look for any blocks or restrictions
4. **Verify you can sign in to Gmail** - Make sure the account itself works

