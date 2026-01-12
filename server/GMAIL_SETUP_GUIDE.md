# Gmail Email Setup Guide - Step by Step

This guide will help you configure Gmail to send email notifications when users submit forms, booking inquiries, and travel period requests.

## 📋 Prerequisites

- A Gmail account
- Access to your Google Account settings

## 🔧 Step-by-Step Setup

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/security
2. Scroll down to "How you sign in to Google"
3. Click on **"2-Step Verification"**
4. Follow the prompts to enable it (you'll need your phone)

> **Why?** Gmail requires 2-Step Verification to generate App Passwords for security.

### Step 2: Generate App Password

1. Go to App Passwords page: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. Under "Select app", choose **"Mail"**
4. Under "Select device", choose **"Other (Custom name)"**
5. Type: **"BT2 Backend"** (or any name you prefer)
6. Click **"Generate"**
7. **IMPORTANT:** Copy the 16-character password that appears
   - It will look like: `abcd efgh ijkl mnop`
   - **Remove all spaces** when using it (should be: `abcdefghijklmnop`)

### Step 3: Update Your .env File

1. Navigate to the `server` folder in your project
2. Open or create a file named `.env` (not `.env.example`)
3. Add or update these lines:

```env
# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
NOTIFICATION_EMAIL=your-email@gmail.com
```

**Example:**
```env
GMAIL_USER=john.doe@gmail.com
GMAIL_APP_PASSWORD=abcd1234efgh5678
NOTIFICATION_EMAIL=john.doe@gmail.com
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the App Password you generated (no spaces!)
- `NOTIFICATION_EMAIL` is where you'll receive notifications (can be different from GMAIL_USER)

### Step 4: Restart Your Backend Server

1. Stop your current server (if running) by pressing `Ctrl+C` in the terminal
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Start the server again:
   ```bash
   npm start
   # or
   pnpm start
   ```

### Step 5: Test the Email Setup

1. Go to your frontend application
2. Submit a booking form or lead form
3. Check your email inbox (and spam folder) for the notification
4. You should see an email with subject like "New Booking Inquiry"

## ✅ Verification

When the server starts, check the console. You should see:
- No warnings about email configuration
- If emails are sent successfully, you'll see: `Email sent: <message-id>`

## 🔍 Troubleshooting

### Problem: "Invalid login" or "Authentication failed"
**Solution:**
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that there are **no spaces** in the App Password in your `.env` file

### Problem: "Less secure app access"
**Solution:**
- App Passwords bypass this requirement, so this shouldn't appear
- If it does, make sure you're using an App Password, not your regular password

### Problem: No emails received
**Solutions:**
1. Check your **spam/junk folder**
2. Verify `NOTIFICATION_EMAIL` in `.env` is correct
3. Check server console for error messages
4. Make sure the server restarted after updating `.env`

### Problem: "Email not configured" warning
**Solution:**
- Verify your `.env` file is in the `server` folder
- Check that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Make sure there are no typos in the variable names

## 📧 What Emails Will You Receive?

You'll receive email notifications for:
1. **Booking Inquiries** - When users submit booking forms
2. **Travel Period Requests** - When users submit travel period selections from TravelPulse
3. **Travel Buddy Trip Confirmations** - When users join travel buddy trips
4. **Form Submissions** - When users submit visa/passport forms

## 🔒 Security Best Practices

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. **Use App Passwords** - Never use your regular Gmail password
3. **Keep App Passwords secret** - Don't share them
4. **Rotate passwords** - Generate new App Passwords periodically

## 📝 Quick Reference

**File to edit:** `server/.env`

**Required variables:**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
NOTIFICATION_EMAIL=where-to-receive-emails@gmail.com
```

**App Password Generator:** https://myaccount.google.com/apppasswords

---

Need help? Check the server console logs for detailed error messages.

