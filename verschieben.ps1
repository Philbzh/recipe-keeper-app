# PowerShell-Skript zum Verschieben des Projekts
# Führe dieses Skript als Administrator aus (Rechtsklick -> "Mit PowerShell ausführen")

Write-Host "=== Projekt wird verschoben ===" -ForegroundColor Green

# Zielverzeichnis (kannst du hier ändern)
$destPath = "$env:USERPROFILE\Desktop\KOCHREZEPTE"
# Alternative: $destPath = "$env:USERPROFILE\KOCHREZEPTE"
# Alternative: $destPath = "C:\KOCHREZEPTE"

# Quellverzeichnis
$sourcePath = "c:\Users\User\..2_PHIL\AI\KOCHREZEPTE"

Write-Host "Quelle: $sourcePath" -ForegroundColor Yellow
Write-Host "Ziel: $destPath" -ForegroundColor Yellow

# Prüfe ob Quelle existiert
if (-not (Test-Path $sourcePath)) {
    Write-Host "FEHLER: Quellverzeichnis nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Erstelle Zielverzeichnis
Write-Host "`nErstelle Zielverzeichnis..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    Write-Host "✓ Verzeichnis erstellt" -ForegroundColor Green
} catch {
    Write-Host "FEHLER: Konnte Verzeichnis nicht erstellen: $_" -ForegroundColor Red
    Write-Host "Tipp: Führe PowerShell als Administrator aus!" -ForegroundColor Yellow
    exit 1
}

# Kopiere Dateien (ohne node_modules)
Write-Host "`nKopiere Dateien (ohne node_modules)..." -ForegroundColor Cyan
try {
    $files = Get-ChildItem -Path $sourcePath -Exclude "node_modules" -Recurse
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($sourcePath.Length + 1)
        $destFile = Join-Path $destPath $relativePath
        $destDir = Split-Path $destFile -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $file.FullName -Destination $destFile -Force
    }
    Write-Host "✓ Dateien kopiert" -ForegroundColor Green
} catch {
    Write-Host "FEHLER beim Kopieren: $_" -ForegroundColor Red
    exit 1
}

# Zeige kopierte Dateien
Write-Host "`nKopierte Dateien:" -ForegroundColor Cyan
Get-ChildItem -Path $destPath -Name | Select-Object -First 15

Write-Host "`n=== Verschieben abgeschlossen! ===" -ForegroundColor Green
Write-Host "`nNächste Schritte:" -ForegroundColor Yellow
Write-Host "1. cd `"$destPath`"" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
