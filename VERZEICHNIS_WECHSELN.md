# Anleitung: Projekt in neues Verzeichnis verschieben

## Option 1: Manuell über Windows Explorer (EINFACHSTE METHODE)

1. **Öffne Windows Explorer** und navigiere zu:
   ```
   c:\Users\User\..2_PHIL\AI\KOCHREZEPTE
   ```

2. **Wähle alle Dateien aus** (Strg+A), **außer** `node_modules`

3. **Kopiere** die Dateien (Strg+C)

4. **Erstelle ein neues Verzeichnis** an einem Ort, wo du Schreibrechte hast, z.B.:
   - `C:\Users\User\Desktop\KOCHREZEPTE`
   - `C:\Users\User\KOCHREZEPTE`
   - Oder ein anderes Verzeichnis deiner Wahl

5. **Füge die Dateien ein** (Strg+V)

6. **Öffne PowerShell** in dem neuen Verzeichnis:
   - Rechtsklick im Explorer → "PowerShell hier öffnen"
   - Oder: `cd "C:\Users\User\Desktop\KOCHREZEPTE"` (oder dein gewähltes Verzeichnis)

7. **Installiere Dependencies neu:**
   ```powershell
   npm install
   ```

8. **Starte den Server:**
   ```powershell
   npm run dev
   ```

## Option 2: Über PowerShell (als Administrator)

1. **PowerShell als Administrator öffnen** (Rechtsklick → "Als Administrator ausführen")

2. **Führe diese Befehle aus:**
   ```powershell
   # Wähle einen Pfad (z.B. Desktop)
   $newPath = "C:\Users\User\Desktop\KOCHREZEPTE"
   
   # Erstelle Verzeichnis
   New-Item -ItemType Directory -Path $newPath -Force
   
   # Kopiere Dateien (ohne node_modules)
   Copy-Item -Path "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE\*" -Destination $newPath -Recurse -Force -Exclude "node_modules"
   
   # Wechsle ins neue Verzeichnis
   cd $newPath
   
   # Installiere Dependencies
   npm install
   
   # Starte Server
   npm run dev
   ```

## Wichtig:

- **node_modules NICHT kopieren** - wird neu installiert mit `npm install`
- **Alle anderen Dateien kopieren** (src, package.json, vite.config.js, etc.)
- Nach dem Verschieben: `npm install` ausführen
- Dann: `npm run dev` starten

## Nach dem Verschieben:

Die App sollte jetzt ohne EPERM-Fehler laufen! 🎉
