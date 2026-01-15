# 🚀 Deployment Guide - FocusList Task Tracker

This guide will help you deploy your FocusList task tracker application to Render for **FREE**.

## 📋 Prerequisites

- [x] GitHub account
- [x] MongoDB Atlas account (you already have this!)
- [x] Your code pushed to GitHub

## 🎯 Recommended Platform: Render

**Why Render?**
- ✅ Free tier available (no credit card required)
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Easy environment variable management
- ✅ Persistent backend service

---

## 📦 Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/pawanmahajan029/FocusList.git

# Push to GitHub
git push -u origin main
```

---

## 🌐 Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (recommended)

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the **FocusList** repository

### 2.3 Configure Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `focuslist-task-tracker` (or any name you prefer) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

### 2.4 Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://pawanmahajan2029_db_user:PAwan%40123@mark02.3grpbff.mongodb.net/personal_tracker?retryWrites=true&w=majority` |

> **⚠️ Important:** Make sure to URL-encode special characters in your MongoDB password!

### 2.5 Deploy!
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Your app will be live at: `https://focuslist-task-tracker.onrender.com`

---

## ✅ Step 3: Verify Deployment

### Test Your Deployed App

1. **Open your Render URL** (e.g., `https://focuslist-task-tracker.onrender.com`)
2. **Check the main page** - Should load `index.html`
3. **Test API health**: Visit `https://your-app.onrender.com/api/health`
   - Should return: `{"status":"Server is running!","timestamp":"..."}`
4. **Add a task** - Fill out the form and submit
5. **View dashboard** - Navigate to `/dashboard.html`
6. **View all tasks** - Navigate to `/tasks-list.html`

---

## 🔧 Troubleshooting

### Issue: "Application failed to respond"
**Solution:** Check Render logs:
1. Go to your service dashboard
2. Click **"Logs"** tab
3. Look for errors (usually MongoDB connection issues)

### Issue: "Cannot connect to database"
**Solution:** Verify MongoDB URI:
1. Check environment variables in Render dashboard
2. Ensure password is URL-encoded (e.g., `@` becomes `%40`)
3. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Issue: "Frontend not loading"
**Solution:** 
1. Check that `server.js` has static file serving enabled
2. Verify frontend files are in the `frontend/` directory
3. Check Render logs for file path errors

### Issue: "Free tier sleeping"
**Note:** Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up. This is normal!

---

## 🔄 Auto-Deployment

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Render will automatically detect and deploy! 🎉
```

---

## 📊 Monitoring

### View Logs
1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. See real-time server logs

### Check Metrics
1. Click **"Metrics"** tab
2. View CPU, Memory, and Request metrics

---

## 🌟 Next Steps

### Custom Domain (Optional)
1. Buy a domain (e.g., from Namecheap, Google Domains)
2. In Render dashboard, go to **"Settings"** → **"Custom Domain"**
3. Add your domain and follow DNS instructions

### Environment Security
1. Never commit `.env` file to GitHub
2. Always use Render's environment variables for secrets
3. Rotate MongoDB credentials periodically

### Performance Optimization
1. Consider upgrading to paid tier for:
   - No sleep on inactivity
   - More resources
   - Better performance

---

## 📝 Summary

**Your deployment URL structure:**
- Main App: `https://your-app.onrender.com/`
- Dashboard: `https://your-app.onrender.com/dashboard.html`
- Tasks List: `https://your-app.onrender.com/tasks-list.html`
- API Health: `https://your-app.onrender.com/api/health`

**Build Command:** `npm install`  
**Start Command:** `npm start`  
**Port:** `10000`

---

## 🆘 Need Help?

- **Render Docs:** [docs.render.com](https://docs.render.com)
- **MongoDB Atlas:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **GitHub Issues:** Report bugs in your repository

---

**🎉 Congratulations! Your FocusList app is now live!** 🎉
