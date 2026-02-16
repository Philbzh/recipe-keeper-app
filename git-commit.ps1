# Git Commit Helper Script für Windows PowerShell
# Führt Git-Befehle immer aus dem Projekt-Root aus

$projectRoot = "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"

# Wechsle ins Projekt-Root
Set-Location $projectRoot

# Zeige Status
Write-Host "`n=== Git Status ===" -ForegroundColor Cyan
git status

# Commit-Nachricht: Entweder als Argument übergeben oder interaktiv abfragen
if ($args.Count -gt 0) {
    $commitMessage = $args[0]
    Write-Host "`nVerwende Commit-Nachricht: $commitMessage" -ForegroundColor Green
} else {
    $commitMessage = Read-Host "`nCommit-Nachricht eingeben"
}

if ($commitMessage) {
    # Füge alle Änderungen hinzu
    Write-Host "`n=== Füge alle Änderungen hinzu ===" -ForegroundColor Yellow
    git add .
    
    # Commit
    Write-Host "`n=== Committe Änderungen ===" -ForegroundColor Yellow
    git commit -m $commitMessage
    
    # Push
    Write-Host "`n=== Pushe zu GitHub ===" -ForegroundColor Yellow
    git push
    
    Write-Host "`n✅ Fertig!" -ForegroundColor Green
} else {
    Write-Host "Abgebrochen - keine Nachricht eingegeben" -ForegroundColor Red
}
