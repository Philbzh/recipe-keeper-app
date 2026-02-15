# Git Commit Anleitung

## Problem
Die Git-Ausgabe zeigt Pfade mit `../`, was bedeutet, dass Git aus einem Unterordner ausgeführt wird.

## Lösung

### Option 1: Aus dem richtigen Verzeichnis arbeiten

1. **Wechsle ins Hauptverzeichnis:**
   ```bash
   cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
   ```

2. **Füge alle Dateien hinzu:**
   ```bash
   git add index.html
   git add src/index.css
   git add src/recipe_keeper_app.tsx
   git add tailwind.config.js
   git add vite.config.js
   git add public/
   git add GITHUB_ICONS_FIX.md
   ```

3. **Oder alle auf einmal:**
   ```bash
   git add index.html src/index.css src/recipe_keeper_app.tsx tailwind.config.js vite.config.js public/ GITHUB_ICONS_FIX.md
   ```

4. **Prüfe den Status:**
   ```bash
   git status
   ```
   Du solltest jetzt "Changes to be committed" sehen.

5. **Commit:**
   ```bash
   git commit -m "Add PWA icons and new features (Dark Mode, Export/Import, Bulk Operations, Print, Share, Duplicate)"
   ```

6. **Push:**
   ```bash
   git push
   ```

### Option 2: Mit GitHub Desktop (Einfacher!)

1. Öffne GitHub Desktop
2. Links siehst du alle Änderungen
3. Setze Häkchen bei allen Dateien (außer `Generated_image.png` und `Generated_image2.png`)
4. Oder klicke auf "Alle Änderungen stagen"
5. Unten Commit-Nachricht eingeben:
   ```
   Add PWA icons and new features (Dark Mode, Export/Import, Bulk Operations, Print, Share, Duplicate)
   ```
6. Klicke auf "Commit to main"
7. Klicke auf "Push origin"

### Option 3: Wenn du bereits im falschen Verzeichnis bist

Wenn du `git status` aus einem Unterordner ausgeführt hast:

```bash
# Gehe zurück ins Hauptverzeichnis
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"

# Dann füge die Dateien hinzu (ohne ../)
git add index.html src/index.css src/recipe_keeper_app.tsx tailwind.config.js vite.config.js public/ GITHUB_ICONS_FIX.md

# Commit
git commit -m "Add PWA icons and new features"

# Push
git push
```

## Wichtige Dateien die hinzugefügt werden müssen:

✅ **Geänderte Dateien:**
- `index.html`
- `src/index.css`
- `src/recipe_keeper_app.tsx`
- `tailwind.config.js`
- `vite.config.js`

✅ **Neue Dateien:**
- `public/` (Ordner mit allen Icons)
- `GITHUB_ICONS_FIX.md`

❌ **Kann ignoriert werden:**
- `Generated_image.png`
- `Generated_image2.png`
