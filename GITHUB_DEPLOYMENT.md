# 🚀 GitHub & Vercel Deployment Anleitung

## Schritt 1: Git installieren (falls noch nicht installiert)

### Windows:
1. Lade Git herunter: https://git-scm.com/download/win
2. Installiere Git mit Standard-Einstellungen
3. Starte ein neues Terminal/PowerShell

### Prüfen ob Git installiert ist:
```powershell
git --version
```

Sollte eine Versionsnummer anzeigen (z.B. `git version 2.42.0`), ist Git installiert.

---

## Schritt 2: Repository vorbereiten

### 1. Terminal öffnen und zum Projekt navigieren

**PowerShell:**
```powershell
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
```

**CMD:**
```cmd
cd c:\Users\User\..2_PHIL\AI\KOCHREZEPTE
```

### 2. Git Repository initialisieren

```bash
git init
```

### 3. Alle Dateien hinzufügen

```bash
git add .
```

### 4. Ersten Commit erstellen

```bash
git commit -m "Initial commit - Recipe Keeper App"
```

### 5. Branch zu "main" umbenennen

```bash
git branch -M main
```

### 6. GitHub Repository verbinden

```bash
git remote add origin https://github.com/Philbzh/recipe-keeper-app.git
```

### 7. Code hochladen

```bash
git push -u origin main
```

**Hinweis:** Beim ersten Push wirst du nach deinen GitHub-Credentials gefragt:
- **Username**: Dein GitHub-Benutzername
- **Password**: Ein Personal Access Token (nicht dein Passwort!)

### Personal Access Token erstellen:
1. Gehe zu: https://github.com/settings/tokens
2. Klicke auf "Generate new token" → "Generate new token (classic)"
3. Wähle Scope: `repo` (vollständiger Zugriff auf private Repositories)
4. Kopiere den Token und verwende ihn als Passwort

---

## Schritt 3: Vercel Deployment

### Option 1: Via Vercel Dashboard (Empfohlen)

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an
2. Klicke auf "Add New Project"
3. Wähle dein GitHub Repository: `Philbzh/recipe-keeper-app`
4. **Wichtig**: Füge Environment Variables hinzu:
   - `VITE_SUPABASE_URL` = `https://xyuwmgmvpshsjskimapy.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. Klicke auf "Deploy"

### Option 2: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Folge den Anweisungen und füge die Environment Variables hinzu.

---

## ✅ Nach dem Deployment

### Environment Variables in Vercel prüfen:
1. Gehe zu deinem Vercel Projekt
2. Settings → Environment Variables
3. Stelle sicher, dass beide Variablen gesetzt sind:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### App testen:
- Deine App sollte jetzt unter `https://dein-projekt.vercel.app` erreichbar sein
- Teste die Supabase-Verbindung
- Teste den Barcode-Scanner

---

## 🔄 Updates hochladen

Nach Änderungen am Code:

```bash
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

Vercel deployt automatisch bei jedem Push zu `main`!

---

## 📝 Wichtige Dateien

- ✅ `.gitignore` - Ignoriert sensible Dateien (.env, node_modules)
- ✅ `README.md` - Projekt-Dokumentation
- ✅ `vercel.json` - Vercel-Konfiguration
- ✅ `.env.example` - Template für Environment Variables

---

## ⚠️ Wichtig: Sicherheit

**NIEMALS** die `.env` Datei committen! Sie enthält deine Supabase-Keys.

Die `.gitignore` ist bereits konfiguriert, um `.env` Dateien zu ignorieren.

---

## 🆘 Troubleshooting

### "Git is not recognized"
→ Git ist nicht installiert oder nicht im PATH. Installiere Git neu.

### "Authentication failed"
→ Verwende einen Personal Access Token statt deines Passworts.

### "Repository not found"
→ Prüfe, ob das Repository auf GitHub existiert und du Zugriff hast.

### Vercel Build fehlgeschlagen
→ Prüfe die Build-Logs in Vercel Dashboard → Deployments → Fehlgeschlagener Build

### Environment Variables funktionieren nicht
→ Stelle sicher, dass die Variablen in Vercel gesetzt sind und mit `VITE_` beginnen.
