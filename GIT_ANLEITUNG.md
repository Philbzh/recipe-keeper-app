# Git-Commit Anleitung für "Phils Rezepte"

## Problem
Wenn du Git-Befehle ausführst, siehst du oft `../` in den Pfaden:
```
modified:   ../src/recipe_keeper_app.tsx
```

Das bedeutet: Du führst Git **nicht** im Projekt-Root aus, sondern in einem Unterordner (z.B. `src`).

---

## ✅ Lösung 1: Immer im Projekt-Root arbeiten

### In Cursor/VS Code Terminal:

**1. Terminal öffnen** (Strg + ` oder Terminal → Neues Terminal)

**2. Zuerst ins Projekt-Root wechseln:**
```powershell
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
```

**3. Dann Git-Befehle ausführen:**
```powershell
git status
git add .
git commit -m "Deine Nachricht"
git push
```

---

## ✅ Lösung 2: PowerShell-Script verwenden

Ich habe ein Script `git-commit.ps1` erstellt. So verwendest du es:

**1. In Cursor Terminal:**
```powershell
cd "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
.\git-commit.ps1
```

**2. Oder direkt:**
```powershell
& "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE\git-commit.ps1"
```

Das Script:
- Wechselt automatisch ins Projekt-Root
- Zeigt `git status`
- Fragt nach Commit-Nachricht
- Führt `git add .`, `git commit` und `git push` aus

---

## ✅ Lösung 3: GitHub Desktop (Einfachste Methode!)

**1. GitHub Desktop öffnen**

**2. Repository auswählen:** 
   - Wähle das Repository **"KOCHREZEPTE"** (den Hauptordner!)
   - NICHT einen Unterordner wie `src`

**3. Änderungen sehen:**
   - Links siehst du alle geänderten Dateien
   - Unten kannst du eine Commit-Nachricht eingeben

**4. Committen:**
   - Klicke auf **"Commit to main"**
   - Dann auf **"Push origin"**

---

## ✅ Lösung 4: Terminal immer im Projekt-Root starten

### In Cursor/VS Code Settings:

**1. Öffne Settings** (Strg + ,)

**2. Suche nach:** `terminal.integrated.cwd`

**3. Setze auf:**
```json
"terminal.integrated.cwd": "c:\\Users\\User\\..2_PHIL\\AI\\KOCHREZEPTE"
```

**Oder in `.vscode/settings.json` im Projekt:**
```json
{
  "terminal.integrated.cwd": "${workspaceFolder}"
}
```

Dann startet jedes neue Terminal automatisch im Projekt-Root!

---

## ✅ Lösung 5: Alias in PowerShell erstellen

Füge zu deiner PowerShell-Profil-Datei hinzu:

```powershell
# Öffne Profil:
notepad $PROFILE

# Füge hinzu:
function git-recipe {
    Set-Location "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"
    git $args
}
```

Dann kannst du einfach `git-recipe status`, `git-recipe commit -m "..."` etc. verwenden!

---

## 🔍 Wie erkenne ich, ob ich im richtigen Ordner bin?

**Richtige Ausgabe:**
```
modified:   src/recipe_keeper_app.tsx
modified:   src/utils.ts
```

**Falsche Ausgabe (aus Unterordner):**
```
modified:   ../src/recipe_keeper_app.tsx
modified:   ../src/utils.ts
```

**Im Terminal prüfen:**
```powershell
pwd
# Sollte zeigen: c:\Users\User\..2_PHIL\AI\KOCHREZEPTE
```

---

## 💡 Empfehlung

**Für Einfachheit:** Verwende **GitHub Desktop** - das ist die einfachste Methode und du kannst nichts falsch machen!

**Für Kontrolle:** Verwende **Lösung 4** (Terminal immer im Projekt-Root) - dann musst du nie mehr `cd` machen.
