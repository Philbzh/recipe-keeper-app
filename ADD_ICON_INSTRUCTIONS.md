# How to Add an Icon to Your App Launcher

## Option 1: Create a Shortcut with Icon (Easiest)

### For start-app.bat:
1. Right-click on `start-app.bat`
2. Select **"Create shortcut"**
3. Right-click the new shortcut → **"Properties"**
4. Click **"Change Icon..."** button
5. Choose an icon:
   - Browse to `C:\Windows\System32\shell32.dll` for Windows icons
   - Or use any `.ico` file
   - Or download a recipe/cooking icon from the internet
6. Click **OK** → **OK**
7. Rename the shortcut to something like "Recipe App"
8. You can pin this shortcut to your taskbar or desktop!

### For start-app.ps1:
1. Right-click on `start-app.ps1`
2. Select **"Create shortcut"**
3. Right-click the shortcut → **"Properties"**
4. Click **"Change Icon..."**
5. Choose an icon (same as above)
6. Click **OK** → **OK**

---

## Option 2: Download a Recipe Icon

### Free Icon Sources:
- **Flaticon**: https://www.flaticon.com/search?word=recipe
- **Icons8**: https://icons8.com/icons/set/recipe
- **IconFinder**: https://www.iconfinder.com/search?q=recipe

### Steps:
1. Download an `.ico` file (or convert PNG to ICO)
2. Save it in your project folder as `app-icon.ico`
3. Use it in the shortcut (see Option 1)

---

## Option 3: Create a Custom Executable (Advanced)

If you want a standalone `.exe` file with an icon:

### Using IExpress (Built into Windows):
1. Create a simple batch file that calls `start-app.bat`
2. Use IExpress wizard to create an installer/launcher
3. Add your icon during the process

### Using Third-Party Tools:
- **Bat To Exe Converter**: Free tool to convert .bat to .exe with icon
- **IcoFX**: Free icon editor

---

## Quick Setup (Recommended)

1. **Create shortcut** of `start-app.bat`
2. **Right-click shortcut** → Properties → Change Icon
3. Browse to: `C:\Windows\System32\shell32.dll`
4. Choose icon #137 (chef hat) or #23 (application)
5. **Pin to taskbar** or place on desktop
6. Done! 🎉

---

## Icon File Locations in Windows

Common icon locations:
- `C:\Windows\System32\shell32.dll` - Windows system icons
- `C:\Windows\System32\imageres.dll` - More Windows icons
- `C:\Windows\System32\mmc.exe` - Application icons

You can browse these files in the "Change Icon" dialog!
