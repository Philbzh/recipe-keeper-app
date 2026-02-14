@echo off
echo ========================================
echo   Projekt wird verschoben...
echo ========================================
echo.

REM Zielverzeichnis (kannst du hier ändern)
set DEST_PATH=%USERPROFILE%\Desktop\KOCHREZEPTE

REM Quellverzeichnis
set SOURCE_PATH=c:\Users\User\..2_PHIL\AI\KOCHREZEPTE

echo Quelle: %SOURCE_PATH%
echo Ziel: %DEST_PATH%
echo.

REM Erstelle Zielverzeichnis
echo Erstelle Zielverzeichnis...
mkdir "%DEST_PATH%" 2>nul
if exist "%DEST_PATH%" (
    echo [OK] Verzeichnis erstellt
) else (
    echo [FEHLER] Konnte Verzeichnis nicht erstellen!
    echo Bitte führe diese Datei als Administrator aus!
    pause
    exit /b 1
)

echo.
echo Kopiere Dateien (ohne node_modules)...
echo.

REM Kopiere alle Dateien außer node_modules
xcopy "%SOURCE_PATH%\*" "%DEST_PATH%\" /E /I /H /Y /EXCLUDE:exclude.txt 2>nul

REM Erstelle exclude.txt temporär
echo node_modules > exclude.txt
xcopy "%SOURCE_PATH%\*" "%DEST_PATH%\" /E /I /H /Y /EXCLUDE:exclude.txt
del exclude.txt

echo.
echo ========================================
echo   Verschieben abgeschlossen!
echo ========================================
echo.
echo Nächste Schritte:
echo 1. cd "%DEST_PATH%"
echo 2. npm install
echo 3. npm run dev
echo.
pause
