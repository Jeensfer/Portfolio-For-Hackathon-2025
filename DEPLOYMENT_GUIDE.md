# 📋 GitHub Repository Creation Guide

## Step-by-Step Instructions

### 1. Sign In to GitHub
- Go to https://github.com
- Click "Sign in" (or "Sign up" if you don't have an account)
- Enter your credentials

### 2. Create New Repository

**Option A: From Homepage**
1. Click the **"+"** icon in the top-right corner
2. Select **"New repository"**

**Option B: From Repositories Tab**
1. Click on your profile picture (top right)
2. Click **"Your repositories"**
3. Click the green **"New"** button

### 3. Fill Repository Details

**Repository Name:**
```
agv-simulator
```

**Description (optional but recommended):**
```
Smart AGV Simulator with obstacle detection and dynamic path planning - Hackathon 2025
```

**Visibility:**
- ✅ Select **"Public"** (required for free GitHub Pages hosting)

**Initialize Repository:**
- ❌ **DO NOT** check "Add a README file" (we already have one)
- ❌ **DO NOT** add .gitignore
- ❌ **DO NOT** choose a license (you can add later)

### 4. Create Repository
- Click the green **"Create repository"** button

### 5. You'll See a Page with Commands

GitHub will show you several options. **Copy these commands** (they'll have YOUR username):

```bash
# Commands will look like this (with YOUR username):
git remote add origin https://github.com/YOUR_USERNAME/agv-simulator.git
git branch -M main
git push -u origin main
```

---

## 🚀 After Creating the Repository

### Run These Commands in Your Terminal:

**1. Add GitHub as remote:**
```powershell
git remote add origin https://github.com/YOUR_USERNAME/agv-simulator.git
```
*(Replace YOUR_USERNAME with your actual GitHub username)*

**2. Rename branch to main:**
```powershell
git branch -M main
```

**3. Push your code:**
```powershell
git push -u origin main
```

**4. Enter credentials when prompted:**
- Username: Your GitHub username
- Password: Your GitHub **Personal Access Token** (not your password!)

---

## 🔑 Creating a Personal Access Token (Required)

GitHub no longer accepts passwords for Git operations. You need a token:

### Steps:
1. Go to GitHub.com
2. Click your profile picture → **Settings**
3. Scroll down → Click **"Developer settings"** (bottom left)
4. Click **"Personal access tokens"** → **"Tokens (classic)"**
5. Click **"Generate new token"** → **"Generate new token (classic)"**
6. Give it a name: `AGV Simulator Deployment`
7. Set expiration: **90 days** (or custom)
8. Check these permissions:
   - ✅ **repo** (all repo permissions)
9. Click **"Generate token"**
10. **COPY THE TOKEN** (you won't see it again!)
11. Use this token as your password when pushing

---

## 🌐 Enable GitHub Pages

After pushing your code:

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Click **"Pages"** in left sidebar
4. Under **"Source"**:
   - Branch: Select **"main"**
   - Folder: Select **"/ (root)"**
5. Click **"Save"**
6. Wait 1-2 minutes

### Your Live URLs:
- **Portfolio**: `https://YOUR_USERNAME.github.io/agv-simulator/portfolio.html`
- **Simulator**: `https://YOUR_USERNAME.github.io/agv-simulator/`

---

## ✅ Quick Checklist

- [ ] GitHub account created/signed in
- [ ] New repository created (name: `agv-simulator`)
- [ ] Repository is **Public**
- [ ] Personal access token generated
- [ ] Git remote added
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] Website is live!

---

## 🆘 Troubleshooting

**Problem: "remote origin already exists"**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/agv-simulator.git
```

**Problem: Authentication failed**
- Make sure you're using your **Personal Access Token**, not your password
- Generate a new token if needed

**Problem: GitHub Pages not working**
- Wait 2-3 minutes after enabling
- Check that repository is **Public**
- Verify files are in the **main** branch

---

## 📞 Need Help?

If you get stuck at any step, let me know and I'll help you troubleshoot!
