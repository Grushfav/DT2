# Deploying Frontend to Render

This guide will help you deploy the BT2 Horizon frontend (Vite + React) to Render as a static site.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your backend API URL (if backend is already deployed)

---

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Create Static Site on Render

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create New Static Site**
   - Click **"New +"** button
   - Select **"Static Site"**

3. **Connect Repository**
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository: `DT2` (or your repo name)
   - Click **"Connect"**

---

## Step 3: Configure Build Settings

Fill in the following settings:

### Basic Settings

- **Name:** `bt2-horizon-frontend` (or your preferred name)
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave empty (root of repo)

### Build Settings

- **Build Command:**
  ```bash
  npm install && npm run build
  ```
  Or if using pnpm:
  ```bash
  pnpm install && pnpm run build
  ```

- **Publish Directory:**
  ```
  dist
  ```

### Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_API_BASE` | `https://your-backend.onrender.com` | Your backend API URL |

**Important:** Replace `https://your-backend.onrender.com` with your actual backend URL.

If your backend is also on Render, it will be something like:
- `https://bt2-backend.onrender.com`
- `https://bt2-api-xxxx.onrender.com`

---

## Step 4: Deploy

1. Click **"Create Static Site"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Run build command (`npm run build`)
   - Deploy the `dist` folder

3. Wait for deployment to complete (usually 2-5 minutes)

---

## Step 5: Access Your Site

Once deployed, Render will provide you with:
- **Live URL:** `https://bt2-horizon-frontend.onrender.com`
- The site will auto-deploy on every push to your main branch

---

## Step 6: Custom Domain (Optional)

1. Go to your static site settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `www.bt2horizon.com`)
4. Follow DNS configuration instructions

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API base URL | `https://bt2-backend.onrender.com` |

### How to Set Environment Variables

1. In Render dashboard, go to your static site
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add `VITE_API_BASE` with your backend URL
5. Click **"Save Changes"**
6. Render will automatically rebuild with new variables

**Note:** After changing environment variables, Render will rebuild your site automatically.

---

## Troubleshooting

### Build Fails

**Error: "Command failed"**
- Check that `package.json` has the correct build script
- Ensure all dependencies are listed in `package.json`
- Check build logs in Render dashboard

**Error: "Module not found"**
- Make sure all dependencies are in `package.json`
- Try clearing cache: Add `npm ci` or `rm -rf node_modules` before build

### Site Shows Blank Page

1. **Check Browser Console** for errors
2. **Verify API URL** - Make sure `VITE_API_BASE` is set correctly
3. **Check Build Output** - Ensure `dist/index.html` exists
4. **Check Routes** - If using React Router, configure redirects (see below)

### API Calls Fail (CORS Errors)

If you see CORS errors:
1. Make sure your backend CORS is configured to allow your frontend domain
2. Update backend CORS settings:
   ```javascript
   app.use(cors({
     origin: ['https://bt2-horizon-frontend.onrender.com', 'http://localhost:5173'],
     credentials: true
   }))
   ```

### Environment Variables Not Working

- **Vite variables must start with `VITE_`** - Only variables prefixed with `VITE_` are exposed to the client
- After adding variables, Render rebuilds automatically
- Check build logs to verify variables are being used

---

## React Router Configuration (If Using)

If you're using React Router with client-side routing, add a `_redirects` file in the `public` folder:

**Create `public/_redirects`:**
```
/*    /index.html   200
```

This ensures all routes are handled by React Router.

---

## Render Configuration File (Alternative Method)

You can also use a `render.yaml` file for infrastructure-as-code:

**Create `render.yaml` in root:**

```yaml
services:
  - type: web
    name: bt2-horizon-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE
        value: https://your-backend.onrender.com
```

Then in Render dashboard:
1. Go to **"New +"** → **"Blueprint"**
2. Connect repository
3. Render will use `render.yaml` for configuration

---

## Continuous Deployment

Render automatically deploys on every push to your main branch. To disable:

1. Go to site settings
2. Click **"Manual Deploy"** tab
3. Toggle **"Auto-Deploy"** off

---

## Build Optimization Tips

### Reduce Build Time

1. **Use `.npmrc`** to speed up installs:
   ```
   engine-strict=false
   ```

2. **Cache node_modules** (Render does this automatically)

3. **Use pnpm** (faster than npm):
   ```bash
   pnpm install && pnpm run build
   ```

### Reduce Bundle Size

1. **Enable compression** (Render does this automatically)
2. **Use code splitting** in Vite
3. **Remove unused dependencies**

---

## Monitoring

Render provides:
- **Build logs** - See what happened during build
- **Deploy logs** - See deployment status
- **Metrics** - View site performance (on paid plans)

---

## Cost

- **Free Tier:** 
  - Static sites are free
  - Auto-sleep after 15 minutes of inactivity (wakes on next request)
  - 750 hours/month free

- **Paid Plans:**
  - Always-on static sites: $7/month
  - Custom domains: Free
  - SSL certificates: Free (automatic)

---

## Quick Checklist

- [ ] Code pushed to Git repository
- [ ] Render account created
- [ ] Static site created and connected to repo
- [ ] Build command set: `npm install && npm run build`
- [ ] Publish directory set: `dist`
- [ ] Environment variable `VITE_API_BASE` set
- [ ] Backend CORS configured to allow frontend domain
- [ ] Site deployed successfully
- [ ] Tested API connections

---

## Example Render Settings Summary

```
Name: bt2-horizon-frontend
Branch: main
Root Directory: (empty)
Build Command: npm install && npm run build
Publish Directory: dist

Environment Variables:
  VITE_API_BASE = https://bt2-backend.onrender.com
```

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Support:** support@render.com
- **Community:** https://community.render.com

---

## Next Steps

After deploying frontend:

1. ✅ Test all features work correctly
2. ✅ Verify API connections
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring/alerts
5. ✅ Set up staging environment (optional)

---

**Last Updated:** 2024

