# 🚀 Deploy to Render - Step-by-Step Guide

Follow these steps to deploy your QR Document Delivery system to the public internet for **FREE**.

---

## ✅ What You'll Get

- **Public URL**: `https://your-app-name.onrender.com`
- **QR codes work anywhere**: Scan from any device, any location
- **Always online**: Runs 24/7 even when your PC is off
- **Free PostgreSQL database**: Stores all shares permanently
- **1GB persistent storage**: Files never get deleted
- **HTTPS included**: Secure connections by default

---

## 📋 Prerequisites

1. **GitHub Account** (free) - [Sign up here](https://github.com/signup)
2. **Render Account** (free) - [Sign up here](https://render.com/register)

---

## Step 1: Create GitHub Repository

### 1.1 Initialize Git Repository

Open terminal in your project folder (`c:\PHONE\scan`) and run:

```bash
git init
git add .
git commit -m "Initial commit - QR Document Delivery System"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `qr-document-delivery` (or any name you want)
3. **Keep it Public** (required for free Render deployment)
4. **Do NOT** initialize with README (we already have code)
5. Click **Create repository**

### 1.3 Push Code to GitHub

Copy the commands from GitHub (should look like this, but with YOUR username):

```bash
   git remote add origin https://github.com/gurusaiss/QR_scan.git
   git branch -M main
   git push -u origin main
   ```
   
   ✅ **Already completed!** Your code is live at https://github.com/gurusaiss/QR_scan

---

## Step 2: Deploy to Render

### 2.1 Login to Render

1. Go to https://render.com
2. Sign in (or sign up if you haven't)
3. Click **Dashboard**

### 2.2 Create New Web Service

1. Click **New +** button (top right)
2. Select **Web Service**
3. Click **Connect** next to your GitHub repository
   - If you don't see it, click "Configure account" to connect GitHub

### 2.3 Configure Web Service

Render will auto-detect your `render.yaml` file. You'll see:

**Service Name**: `qr-document-delivery` (or customize)  
**Plan**: **Free** ✅  

Click **Apply**.

Render will automatically:
- Create a PostgreSQL database (free)
- Set up persistent storage (1GB)
- Configure environment variables
- Deploy your app

### 2.4 Wait for Deployment

- First deployment takes ~5 minutes
- You'll see build logs in real-time
- Wait for **"Live"** status (green)

---

## Step 3: Get Your Public URL

Once deployment is complete:

1. You'll see your URL: `https://qr-document-delivery-xxxx.onrender.com`
2. **Click the URL** to open your app
3. **Test Upload**: Upload files and generate QR code
4. **Test Download**: Scan QR with your phone

---

## 🎉 You're Live!

Your QR Document Delivery system is now **publicly accessible**!

### What Works Now:

✅ **Upload from anywhere**: Open your Render URL on any device  
✅ **QR codes work globally**: Share and scan from anywhere  
✅ **24/7 availability**: Always online, no PC required  
✅ **Persistent files**: Files stored permanently in cloud  
✅ **Free PostgreSQL**: All data saved in database  
✅ **HTTPS secure**: Encrypted connections  

---

## 📱 How to Use

### Upload Files:
1. Go to: `https://your-app-name.onrender.com`
2. Upload files (drag & drop)
3. Configure settings
4. Click "Generate QR Code"
5. Share QR or URL

### Download Files:
1. Scan QR code with phone
2. Click "Download All Files"
3. Files download as ZIP

---

## ⚙️ Optional: Custom Domain

Want your own domain like `docs.yourcompany.com`?

1. In Render Dashboard → Settings → Custom Domains
2. Add your domain
3. Update DNS records as shown
4. Free SSL certificate included

---

## 🔧 Troubleshooting

### Issue: "Application Error" after deployment

**Solution**: Check logs in Render dashboard
- Click your service
- Go to "Logs" tab
- Look for error messages

### Issue: Files not persisting

**Solution**: Verify disk is mounted
- In Render dashboard → Disks
- Should show "uploads" disk (1GB)
- Status should be "Mounted"

### Issue: Database connection failed

**Solution**: 
- Go to Render dashboard → Databases
- Verify `qr-docs-db` is "Available"
- Check environment variables have `DATABASE_URL`

---

## 📊 Monitor Your App

### View Analytics:
- Go to Render dashboard
- Click your service
- View: Metrics, Logs, Events

### Database Management:
1. Click your database (`qr-docs-db`)
2. Get connection string
3. Use tools like pgAdmin or DBeaver to view data

---

## 🔄 Update Your App

Made changes to code? Update deployment:

```bash
git add .
git commit -m "Updated features"
git push
```

Render will **automatically deploy** your changes!

---

## 💰 Cost

**Everything is FREE** with these limitations:
- Web Service: Spins down after 15 min of inactivity (wakes up in ~1 min)
- Database: 1GB storage, 256MB RAM
- Disk: 1GB for uploaded files

**To upgrade** (optional):
- Paid plan: $7/month
- Always-on service
- More storage and resources

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Discord**: https://discord.gg/render
- **GitHub Issues**: Open issue in your repository

---

## ✅ Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Created Render account
- [ ] Deployed web service
- [ ] Verified database created
- [ ] Tested upload on public URL
- [ ] Tested QR code scanning
- [ ] Tested file download

---

**🎊 Congratulations! Your QR Document Delivery system is now LIVE on the internet!**

Share your public URL with anyone, anywhere. QR codes will work forever (or until expiration date).
