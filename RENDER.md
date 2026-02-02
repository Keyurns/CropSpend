# Render Deployment Guide

This guide walks you through deploying the Expense Tracker app to [Render](https://render.com).

## Prerequisites

1. **GitHub/GitLab account** with your code pushed to a repository
2. **Render account** ([Sign up free](https://dashboard.render.com/register))
3. **MongoDB Atlas** database (already configured from development)

---

## Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Expense Tracker"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

---

## Step 2: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab account if not already connected
4. Select your repository

---

## Step 3: Configure the Web Service

Use these settings:

| Setting | Value |
|---------|-------|
| **Name** | `expense-tracker` (or any name you prefer) |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your default branch) |
| **Runtime** | **Docker** |
| **Instance Type** | Free (or paid for better performance) |

### Dockerfile Path
Leave as default: `./Dockerfile`

---

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/expense-tracker` |
| `JWT_SECRET` | `your-secure-random-string-here` |
| `EMAIL_USER` | `your_email@gmail.com` (optional) |
| `EMAIL_PASS` | `your_app_password` (optional) |
| `NODE_ENV` | `production` |

**Important Notes:**
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a strong random string for `JWT_SECRET`
- Email variables are optional (demo mode works without them)

---

## Step 5: Configure Health Check (Optional but Recommended)

Under **Advanced Settings**, set:

| Setting | Value |
|---------|-------|
| **Health Check Path** | `/api/health` or leave blank |
| **Docker Command** | Leave empty (uses Dockerfile CMD) |

---

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Build the Docker image
   - Deploy the container
3. Wait for the build to complete (5-10 minutes for first deploy)

---

## Step 7: Access Your App

Once deployed, Render provides a URL like:
```
https://expense-tracker-xxxx.onrender.com
```

Your app is now live!

---

## MongoDB Atlas: Allow Render IPs

**Important:** Update MongoDB Atlas Network Access to allow Render's servers:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access** → **Add IP Address**
3. Choose one option:
   - **Allow Access from Anywhere**: `0.0.0.0/0` (easiest, less secure)
   - **Add Render IPs**: See [Render's outbound IPs](https://render.com/docs/static-outbound-ip-addresses)

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Port for the server (Render uses this) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `EMAIL_USER` | No | Gmail address for sending reports |
| `EMAIL_PASS` | No | Gmail App Password |
| `NODE_ENV` | Recommended | Set to `production` |

---

## Troubleshooting

### Build Fails

**Check the build logs in Render dashboard:**
- Missing dependencies → Check `package.json` files
- Memory issues → Upgrade to paid instance
- Node version issues → Dockerfile uses Node 18

### MongoDB Connection Fails

- **ECONNREFUSED**: Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
- **Authentication failed**: Double-check username/password in `MONGODB_URI`
- **DNS issues**: Try using the direct connection string format

### App Shows Blank Page

- Rebuild: Render Dashboard → Manual Deploy → Clear build cache
- Check if frontend build succeeded in logs

### Slow Cold Starts (Free Tier)

Free tier instances spin down after 15 minutes of inactivity. First request after idle period takes ~30 seconds. Upgrade to paid tier to keep instance running.

---

## Useful Render Dashboard Features

| Feature | Location |
|---------|----------|
| **View Logs** | Dashboard → Your Service → Logs |
| **Manual Deploy** | Dashboard → Your Service → Manual Deploy |
| **Environment Vars** | Dashboard → Your Service → Environment |
| **Restart Service** | Dashboard → Your Service → Settings → Restart |
| **Custom Domain** | Dashboard → Your Service → Settings → Custom Domains |

---

## Adding a Custom Domain (Optional)

1. Go to your service in Render Dashboard
2. Click **Settings** → **Custom Domains**
3. Click **Add Custom Domain**
4. Follow DNS configuration instructions

---

## Auto-Deploy Setup

Render automatically deploys when you push to your connected branch:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main
# Render automatically deploys!
```

To disable auto-deploy:
- Dashboard → Your Service → Settings → Build & Deploy → Toggle off "Auto-Deploy"

---

## Cost Summary

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 750 hours/month, spins down after 15min idle |
| **Starter** | $7/month | Always on, 512 MB RAM |
| **Standard** | $25/month | 2 GB RAM, better performance |

---

## Quick Reference

```bash
# Your app URL (replace with actual)
https://expense-tracker-xxxx.onrender.com

# API endpoint
https://expense-tracker-xxxx.onrender.com/api/...

# Check health
curl https://expense-tracker-xxxx.onrender.com/api/health
```

---

## Next Steps After Deployment

1. ✅ Test all features (login, register, expenses, reports)
2. ✅ Set up a custom domain (optional)
3. ✅ Configure email settings for reports (optional)
4. ✅ Consider upgrading to paid tier for always-on availability
