# Deploying Backend to Render

This guide will help you deploy the BT2 Horizon backend (Express.js + Supabase) to Render as a Web Service.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Supabase project set up with database schema
4. Environment variables ready (Supabase credentials, JWT secret, etc.)

---

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

**Important:** Make sure your `.env` file is in `.gitignore` (never commit secrets to Git!)

---

## Step 2: Create Web Service on Render

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create New Web Service**
   - Click **"New +"** button
   - Select **"Web Service"**

3. **Connect Repository**
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository: `DT2` (or your repo name)
   - Click **"Connect"**

---

## Step 3: Configure Build Settings

Fill in the following settings:

### Basic Settings

- **Name:** `bt2-backend` (or your preferred name)
- **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `server` (important! Your backend code is in the `server` folder)
- **Runtime:** `Node`
- **Build Command:** 
  ```bash
  npm install
  ```
  Or if using pnpm:
  ```bash
  pnpm install --frozen-lockfile
  ```
  
  **Important:** Do NOT include `npm run build` or `pnpm run build` - the backend doesn't have a build script. Just install dependencies.

- **Start Command:**
  ```bash
  npm start
  ```
  Or if using pnpm:
  ```bash
  pnpm start
  ```

### Instance Type

- **Free Tier:** 512 MB RAM (suitable for development/testing)
- **Starter Plan:** $7/month for 512 MB RAM (always-on, no sleep)
- **Standard Plan:** $25/month for 2 GB RAM (recommended for production)

**Note:** Free tier services sleep after 15 minutes of inactivity and wake on next request (may take 30-60 seconds).

---

## Step 4: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add all required variables:

### Required Environment Variables

| Key | Value | Description | Where to Get |
|-----|-------|-------------|--------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase service role key (secret!) | Supabase Dashboard > Settings > API > service_role key |
| `PORT` | `4000` | Server port (Render sets this automatically, but keep for local dev) | - |
| `ADMIN_KEY` | `your-secure-admin-key` | Secret key for admin API access | Generate a strong random string |
| `JWT_SECRET` | `your-jwt-secret-key` | Secret for JWT token signing | Generate a strong random string |

### Optional Environment Variables (Email)

| Key | Value | Description |
|-----|-------|-------------|
| `GMAIL_USER` | `your-email@gmail.com` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` | Gmail App Password (not regular password) |
| `NOTIFICATION_EMAIL` | `notifications@example.com` | Email to receive notifications |

**Important Notes:**
- Render automatically sets `PORT` environment variable - your code should use `process.env.PORT || 4000`
- Never commit `.env` file to Git
- Use strong, random strings for `ADMIN_KEY` and `JWT_SECRET` (you can use: `openssl rand -base64 32`)

### How to Set Environment Variables

1. In Render dashboard, go to your web service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable one by one
5. Click **"Save Changes"**
6. Render will automatically restart the service

---

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Navigate to `server` directory
   - Install dependencies (`npm install`)
   - Start the server (`npm start`)
3. Wait for deployment to complete (usually 2-5 minutes)
4. Check build logs for any errors

---

## Step 6: Verify Deployment

Once deployed, Render will provide you with:
- **Live URL:** `https://bt2-backend.onrender.com` (or your custom name)

### Test Your Backend

1. **Health Check:**
   ```bash
   curl https://bt2-backend.onrender.com/api/health
   ```
   (If you have a health endpoint)

2. **Test Public Endpoint:**
   ```bash
   curl https://bt2-backend.onrender.com/api/packages
   ```

3. **Check Logs:**
   - Go to Render dashboard → Your service → **"Logs"** tab
   - Look for any errors or warnings

---

## Step 7: Update CORS Settings

Update your backend CORS configuration to allow your frontend domain:

In `server/index.js`, update the CORS configuration:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend.onrender.com',  // Your Render frontend URL
    'http://localhost:5173',                // Local development
    'http://localhost:3000'                 // Alternative local port
  ],
  credentials: true
}))
```

**Or** use environment variable for frontend URL:

```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}))
```

Then add `FRONTEND_URL` to Render environment variables.

---

## Step 8: Update Frontend API URL

After backend is deployed, update your frontend's `VITE_API_BASE` environment variable:

1. Go to your frontend service on Render
2. Go to **"Environment"** tab
3. Update `VITE_API_BASE` to: `https://bt2-backend.onrender.com`
4. Save and redeploy

---

## Step 9: Serve Admin Dashboard

Your backend serves `admin.html` at `/admin.html`. After deployment:

- **Admin Dashboard URL:** `https://bt2-backend.onrender.com/admin.html`

Make sure the admin dashboard JavaScript uses the correct API base URL. Check `server/admin.html` for any hardcoded URLs.

---

## Troubleshooting

### Service Won't Start

**Error: "Cannot find module"**
- Check that `package.json` has all dependencies listed
- Verify `Root Directory` is set to `server`
- Check build logs for missing dependencies

**Error: "Port already in use"**
- Render sets `PORT` automatically - make sure your code uses `process.env.PORT || 4000`
- Don't hardcode port numbers

**Error: "ENOENT: no such file or directory"**
- Verify `Root Directory` is set to `server`
- Check that `index.js` exists in the `server` folder

### Database Connection Issues

**Error: "Failed to connect to Supabase"**
- Verify `SUPABASE_URL` is correct (no trailing slash)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- Check Supabase project is active and not paused

### CORS Errors

If frontend can't connect to backend:
1. Check CORS configuration in `server/index.js`
2. Verify frontend URL is in allowed origins
3. Check browser console for specific CORS error messages

### Environment Variables Not Working

- Variables must be set in Render dashboard (not in `.env` file)
- After adding variables, service restarts automatically
- Check logs to verify variables are being read
- Use `console.log(process.env.VARIABLE_NAME)` to debug (remove in production)

### Service Keeps Sleeping (Free Tier)

Free tier services sleep after 15 minutes of inactivity:
- First request after sleep takes 30-60 seconds to wake
- Consider upgrading to Starter plan ($7/month) for always-on service
- Or use a service like UptimeRobot to ping your service every 10 minutes

---

## Render Configuration File (Alternative Method)

You can use a `render.yaml` file for infrastructure-as-code:

**Create `render.yaml` in root:**

```yaml
services:
  - type: web
    name: bt2-backend
    runtime: node
    plan: free  # or starter, standard
    region: oregon
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    rootDir: server
    envVars:
      - key: SUPABASE_URL
        sync: false  # Set manually in dashboard
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false  # Set manually in dashboard
      - key: PORT
        value: 4000
      - key: ADMIN_KEY
        sync: false  # Set manually in dashboard
      - key: JWT_SECRET
        sync: false  # Set manually in dashboard
      - key: FRONTEND_URL
        value: https://your-frontend.onrender.com
```

Then in Render dashboard:
1. Go to **"New +"** → **"Blueprint"**
2. Connect repository
3. Render will use `render.yaml` for configuration

---

## Continuous Deployment

Render automatically deploys on every push to your main branch. To disable:

1. Go to service settings
2. Click **"Manual Deploy"** tab
3. Toggle **"Auto-Deploy"** off

---

## Monitoring & Logs

Render provides:
- **Build logs** - See what happened during build
- **Runtime logs** - See server output in real-time
- **Metrics** - View CPU, memory usage (on paid plans)
- **Events** - See deployment history

### Viewing Logs

1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. See real-time logs
4. Use search/filter to find specific errors

---

## Security Best Practices

1. **Never commit `.env` file** - Always use `.gitignore`
2. **Use strong secrets** - Generate random strings for `ADMIN_KEY` and `JWT_SECRET`
3. **Rotate secrets regularly** - Change keys periodically
4. **Limit CORS origins** - Only allow your frontend domains
5. **Use HTTPS** - Render provides SSL automatically
6. **Monitor logs** - Check for suspicious activity

---

## Cost

- **Free Tier:** 
  - 750 hours/month free
  - Sleeps after 15 minutes inactivity
  - 512 MB RAM
  - Suitable for development/testing

- **Starter Plan:** $7/month
  - Always-on (no sleep)
  - 512 MB RAM
  - Good for small production apps

- **Standard Plan:** $25/month
  - Always-on
  - 2 GB RAM
  - Better performance
  - Recommended for production

---

## Quick Checklist

- [ ] Code pushed to Git repository
- [ ] `.env` file in `.gitignore`
- [ ] Render account created
- [ ] Web service created and connected to repo
- [ ] Root directory set to `server`
- [ ] Build command: `npm install` (or `pnpm install`)
- [ ] Start command: `npm start` (or `pnpm start`)
- [ ] All environment variables set in Render dashboard
- [ ] CORS configured for frontend domain
- [ ] Service deployed successfully
- [ ] Tested API endpoints
- [ ] Frontend updated with backend URL

---

## Example Render Settings Summary

```
Name: bt2-backend
Region: Oregon (US West)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free (or Starter/Standard)

Environment Variables:
  SUPABASE_URL = https://xxxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
  PORT = 4000
  ADMIN_KEY = your-secure-admin-key
  JWT_SECRET = your-jwt-secret-key
  FRONTEND_URL = https://bt2-horizon-frontend.onrender.com
  GMAIL_USER = your-email@gmail.com (optional)
  GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx (optional)
  NOTIFICATION_EMAIL = notifications@example.com (optional)
```

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Support:** support@render.com
- **Community:** https://community.render.com
- **Node.js on Render:** https://render.com/docs/node

---

## Next Steps

After deploying backend:

1. ✅ Test all API endpoints
2. ✅ Verify database connections
3. ✅ Test admin dashboard (`/admin.html`)
4. ✅ Update frontend with backend URL
5. ✅ Set up monitoring/alerts
6. ✅ Configure custom domain (optional)
7. ✅ Set up staging environment (optional)

---

## Common Commands

### Generate Secure Secrets

```bash
# Generate ADMIN_KEY
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

### Test Backend Locally Before Deploying

```bash
cd server
npm install
npm start
```

### Check Backend Health

```bash
# Test packages endpoint
curl https://bt2-backend.onrender.com/api/packages

# Test with admin key
curl -H "x-admin-key: your-admin-key" https://bt2-backend.onrender.com/api/packages
```

---

**Last Updated:** 2024

