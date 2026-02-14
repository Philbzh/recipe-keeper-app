# Projekt verschieben - Anleitung

Das Problem mit dem EPERM-Fehler wird durch den ungewöhnlichen Pfad `..2_PHIL` verursacht.

## Lösung: Projekt verschieben

1. **Neues Verzeichnis erstellen:**
   ```powershell
   mkdir C:\Users\User\Documents\KOCHREZEPTE
   ```

2. **Alle Dateien kopieren:**
   ```powershell
   Copy-Item -Path "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE\*" -Destination "C:\Users\User\Documents\KOCHREZEPTE" -Recurse -Force
   ```

3. **In das neue Verzeichnis wechseln:**
   ```powershell
   cd C:\Users\User\Documents\KOCHREZEPTE
   ```

4. **Server starten:**
   ```powershell
   npm run dev
   ```

## Alternative: Symlink erstellen

Falls du den aktuellen Pfad behalten möchtest, kannst du einen Symlink erstellen:

```powershell
New-Item -ItemType SymbolicLink -Path "C:\KOCHREZEPTE" -Target "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
cd C:\KOCHREZEPTE
npm run dev
```
