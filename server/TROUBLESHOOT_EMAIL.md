# Troubleshooting Gmail Authentication Error

## Error: "535-5.7.8 Username and Password not accepted"

This error means Gmail is rejecting your credentials. Here's how to fix it:

## ✅ Step-by-Step Fix

### 1. Verify 2-Step Verification is Enabled
- Go to: https://myaccount.google.com/security
- Make sure **"2-Step Verification"** is **ON** (not just enabled, but actively working)
- If it's off, enable it first

### 2. Generate a NEW App Password
The current App Password might be invalid. Generate a fresh one:

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Under "Select app", choose **"Mail"**
4. Under "Select device", choose **"Other (Custom name)"**
5. Type: **"BT2 Backend"**
6. Click **"Generate"**
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
8. **IMPORTANT:** Remove ALL spaces when pasting into .env

### 3. Update Your .env File

Make sure your `.env` file looks exactly like this (no quotes, no spaces in password):

```env
GMAIL_USER=gavin.seaton.jm@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password-no-spaces
NOTIFICATION_EMAIL=gavin.seaton.jm@gmail.com
```

**Common mistakes:**
- ❌ `GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"` (with quotes and spaces)
- ❌ `GMAIL_APP_PASSWORD=abcd efgh ijkl mnop` (with spaces)
- ✅ `GMAIL_APP_PASSWORD=abcdefghijklmnop` (no spaces, no quotes)

### 4. Verify Your Gmail Account
- Make sure you're using a **personal Gmail account** (not a Google Workspace account)
- Some Google Workspace accounts have restrictions
- Try with a different Gmail account if issues persist

### 5. Check for Account Security Issues
- Go to: https://myaccount.google.com/security
- Check if there are any security alerts
- Make sure your account isn't locked or restricted

### 6. Restart Server After Changes
After updating `.env`:
```bash
# Stop server (Ctrl+C)
cd server
pnpm start
```

## 🔍 Alternative: Use OAuth2 (More Secure)

If App Passwords continue to fail, you can use OAuth2 instead. This requires more setup but is more secure.

## 📝 Quick Checklist

- [ ] 2-Step Verification is enabled
- [ ] Generated a NEW App Password
- [ ] Removed ALL spaces from App Password in .env
- [ ] No quotes around the password in .env
- [ ] Restarted the server after changes
- [ ] Using a personal Gmail account (not Workspace)

## 🆘 Still Not Working?

1. **Try a different Gmail account** - Some accounts have restrictions
2. **Check Gmail security settings** - Make sure nothing is blocking app access
3. **Wait a few minutes** - Sometimes Gmail needs time to recognize new App Passwords
4. **Check server console** - Look for any other error messages

