# 🚀 Schnellstart: Code zu GitHub hochladen

## ⚡ Option 1: GitHub Desktop (EINFACHSTE Methode)

### Schritt 1: GitHub Desktop installieren
1. Lade GitHub Desktop herunter: https://desktop.github.com/
2. Installiere es mit Standard-Einstellungen
3. Melde dich mit deinem GitHub-Account an

### Schritt 2: Repository hinzufügen
1. Öffne GitHub Desktop
2. Klicke auf **"File" → "Add Local Repository"**
3. Klicke auf **"Choose..."** und navigiere zu:
   ```
   c:\Users\User\..2_PHIL\AI\KOCHREZEPTE
   ```
4. **WICHTIG**: Wenn GitHub Desktop sagt "This directory does not appear to be a Git repository":
   - Klicke auf **"Create a repository"** (nicht "Add repository")
   - Oder: Siehe `GITHUB_DESKTOP_FIX.md` für Lösung

### Schritt 3: Ersten Commit erstellen
1. GitHub Desktop zeigt alle geänderten Dateien
2. Unten links: Gib eine Commit-Nachricht ein: `Initial commit - Recipe Keeper App`
3. Klicke auf **"Commit to main"**

### Schritt 4: Zu GitHub pushen
1. Klicke oben auf **"Publish repository"**
2. Repository-Name: `recipe-keeper-app`
3. Beschreibung: `Eine intuitive PWA für Kochrezepte mit Einkaufsliste`
4. **WICHTIG**: Entferne das Häkchen bei "Keep this code private" (wenn du es öffentlich machen willst)
5. Klicke auf **"Publish Repository"**

✅ **Fertig!** Dein Code ist jetzt auf GitHub!

---

## ⚡ Option 2: Git Command Line (Für Fortgeschrittene)

### Schritt 1: Git installieren
1. Lade Git herunter: https://git-scm.com/download/win
2. Installiere mit **Standard-Einstellungen** (wichtig: "Git from the command line" aktivieren)
3. **Neues Terminal/PowerShell öffnen** (wichtig: nach Installation!)

### Schritt 2: Befehle ausführen

Öffne PowerShell oder CMD und führe diese Befehle **einer nach dem anderen** aus:

```powershell
# Zum Projekt-Verzeichnis navigieren
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"

# Git Repository initialisieren
git init

# Alle Dateien hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initial commit - Recipe Keeper App"

# Branch zu main umbenennen
git branch -M main

# GitHub Repository verbinden
git remote add origin https://github.com/Philbzh/recipe-keeper-app.git

# Code hochladen
git push -u origin main
```

**Bei `git push` wirst du nach Credentials gefragt:**
- **Username**: `Philbzh` (oder dein GitHub-Username)
- **Password**: **Personal Access Token** (siehe unten)

### Personal Access Token erstellen:
1. Gehe zu: https://github.com/settings/tokens
2. Klicke auf **"Generate new token" → "Generate new token (classic)"**
3. Name: `Vercel Deployment`
4. Scopes: Aktiviere `repo` (vollständiger Zugriff)
5. Klicke auf **"Generate token"**
6. **Kopiere den Token sofort** (er wird nur einmal angezeigt!)
7. Verwende diesen Token als Passwort bei `git push`

---

## ⚡ Option 3: GitHub Web Interface (Manuell)

Falls Git nicht installiert werden kann:

1. Gehe zu: https://github.com/Philbzh/recipe-keeper-app
2. Klicke auf **"uploading an existing file"**
3. Ziehe alle Dateien aus `c:\Users\User\..2_PHIL\AI\KOCHREZEPTE` in den Browser
4. **WICHTIG**: Überspringe diese Dateien/Ordner:
   - `node_modules/` (zu groß)
   - `.env` (sensibel!)
   - `dist/` (wird beim Build erstellt)
5. Commit-Nachricht: `Initial commit`
6. Klicke auf **"Commit changes"**

⚠️ **Nachteil**: Du musst bei jedem Update manuell hochladen.

---

## ✅ Nach dem Upload: Vercel verbinden

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke auf **"Add New Project"**
3. Wähle dein Repository: `Philbzh/recipe-keeper-app`
4. **Framework Preset**: Wähle **"Vite"** (oder lasse es automatisch erkennen)
5. **Root Directory**: `.` (Standard)
6. **Build Command**: `npm run build` (sollte automatisch sein)
7. **Output Directory**: `dist` (sollte automatisch sein)

### Environment Variables hinzufügen:
Klicke auf **"Environment Variables"** und füge hinzu:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xyuwmgmvpshsjskimapy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dXdtZ212cHNoc2pza2ltYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTY4ODUsImV4cCI6MjA4NjA3Mjg4NX0.guT_u_uEB-oz1sIFkFLo4M6zDPbY91tOvpoozVSKM2s` |

8. Klicke auf **"Deploy"**

✅ **Fertig!** Deine App wird jetzt gebaut und deployed!

---

## 🎯 Empfehlung

**Für dich: Option 1 (GitHub Desktop)** 🏆

- ✅ Einfachste Methode
- ✅ Grafische Oberfläche
- ✅ Keine Command-Line nötig
- ✅ Automatische Updates möglich

---

## 📝 Checkliste vor dem Upload

- [x] `.gitignore` prüft auf `.env` (✅ bereits erledigt)
- [x] `README.md` erstellt (✅ bereits erledigt)
- [x] `vercel.json` erstellt (✅ bereits erledigt)
- [x] `package.json` mit Repository-Info (✅ bereits erledigt)
- [ ] Git installiert oder GitHub Desktop installiert
- [ ] Code zu GitHub hochgeladen
- [ ] Vercel Projekt erstellt
- [ ] Environment Variables in Vercel gesetzt

---

## 🆘 Hilfe

Falls etwas nicht funktioniert:
1. Prüfe die Fehlermeldung
2. Siehe `GITHUB_DEPLOYMENT.md` für detaillierte Troubleshooting-Tipps
3. GitHub Docs: https://docs.github.com/en/get-started
