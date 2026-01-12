# Email Setup Guide

## Gmail Configuration

To enable email notifications, you need to set up Gmail App Passwords.

### Steps:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "BT2 Backend" as the name
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Update `.env` file**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop  # Remove spaces from the app password
   NOTIFICATION_EMAIL=your-email@gmail.com  # Where to receive notifications
   ```

4. **Restart the backend server**:
   ```bash
   cd server
   pnpm start
   ```

### Testing

After setup, test the email functionality by:
1. Submitting a lead form on the frontend
2. Check your email inbox for the notification

### Troubleshooting

- **"Invalid login"**: Make sure you're using an App Password, not your regular Gmail password
- **"Less secure app"**: App Passwords bypass this, so it shouldn't be an issue
- **No emails received**: Check spam folder, verify `NOTIFICATION_EMAIL` is correct

