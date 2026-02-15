# Icons zu GitHub hinzufügen

Die PWA-Icons wurden lokal erstellt, müssen aber noch zu GitHub hinzugefügt werden.

## Problem
GitHub zeigt die Icon-Dateien als leer an, weil sie noch nicht committed wurden.

## Lösung mit GitHub Desktop

1. **Öffne GitHub Desktop**
2. **Prüfe die Änderungen:**
   - Du solltest die neuen Dateien sehen:
     - `public/pwa-192x192.png`
     - `public/pwa-512x512.png`
     - `public/apple-touch-icon.png`
     - `public/favicon.ico`
   - Und geänderte Dateien:
     - `src/recipe_keeper_app.tsx` (alle neuen Features)
     - `vite.config.js` (PWA-Konfiguration)
     - `tailwind.config.js` (Dark Mode)
     - `index.html` (Manifest-Link)
     - `src/index.css` (Dark Mode Styles)

3. **Staging:**
   - Wähle alle neuen und geänderten Dateien aus
   - Oder klicke auf "Alle Änderungen stagen"

4. **Commit:**
   - Schreibe eine Commit-Nachricht, z.B.:
     ```
     Add PWA icons and new features (Dark Mode, Export/Import, Bulk Operations, Print, Share, Duplicate)
     ```

5. **Push:**
   - Klicke auf "Push origin" um die Änderungen zu GitHub zu pushen

## Alternative: Manuell über Terminal (falls Git installiert ist)

```bash
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
git add public/*.png public/*.ico
git add src/recipe_keeper_app.tsx vite.config.js tailwind.config.js index.html src/index.css
git commit -m "Add PWA icons and new features"
git push
```

## Was wurde hinzugefügt?

### Neue Dateien:
- `public/pwa-192x192.png` - Kleines PWA-Icon (5.1 MB)
- `public/pwa-512x512.png` - Großes PWA-Icon (4.6 MB)
- `public/apple-touch-icon.png` - Apple Touch Icon (5.5 MB)
- `public/favicon.ico` - Browser Favicon (wurde jetzt hinzugefügt)

### Neue Features im Code:
- ✅ Dark Mode Toggle
- ✅ Rezept-Export (JSON)
- ✅ Rezept-Import (JSON)
- ✅ Bulk-Operationen (Mehrfachauswahl)
- ✅ Rezept-Duplikation
- ✅ Druckfunktion
- ✅ Rezept-Teilen
- ✅ PWA-Konfiguration

Nach dem Push sollten alle Dateien auf GitHub sichtbar sein!
