# How to Start Your Recipe App

## Quick Start (Development)

### 1. Open Terminal/Command Prompt
- Press `Win + R`, type `powershell`, press Enter
- Or open PowerShell/Command Prompt from the Start menu

### 2. Navigate to Your Project Folder
```powershell
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
```

### 3. Start the Development Server
```powershell
npm run dev
```

### 4. Open in Browser
- The terminal will show something like:
  ```
  ➜  Local:   http://localhost:5173/
  ```
- Open this URL in your browser (Chrome, Firefox, Edge, etc.)

### 5. Use Your App
- If you see a login screen, sign in with your account
- Start adding recipes!

### 6. Stop the Server
- Press `Ctrl + C` in the terminal to stop the server

---

## Alternative: Create a Start Script

You can create a batch file to make it even easier:

### Create `start-app.bat`:
```batch
@echo off
cd /d "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
echo Starting Recipe App...
npm run dev
pause
```

Then just double-click `start-app.bat` to start!

---

## Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "Port 5173 is already in use"
- Another instance is running
- Close other terminals or restart your computer
- Or the server will automatically use port 5174

### "Cannot find module"
- Run: `npm install`
- This installs all required packages

### White page or errors
- Check the browser console (F12 → Console tab)
- Make sure the `.env` file exists with your Supabase credentials
- Restart the server after changing `.env`

---

## Production Deployment (Optional)

For a permanent online version, you can deploy to:
- **Supabase Hosting** (recommended - see `SUPABASE_DEPLOY.md`)
- **Vercel** (free hosting)
- **Netlify** (free hosting)

---

## Summary

**Every time you want to use your app:**

1. Open PowerShell/Terminal
2. Navigate to project folder: `cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"`
3. Run: `npm run dev`
4. Open browser: `http://localhost:5173`
5. Sign in and use your app!

**To stop:** Press `Ctrl + C` in the terminal
