@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "OUTPUT=%ROOT%\AI-Health-Diet.zip"

echo ============================================
echo    Packaging AI Health Diet...
echo ============================================
echo.

:: Check if PowerShell is available (for Compress-Archive)
where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell not found
    pause
    exit /b 1
)

:: Remove old zip
if exist "%OUTPUT%" del "%OUTPUT%"

:: Create temp staging directory
set "STAGING=%TEMP%\ai-health-diet-package"
if exist "%STAGING%" rmdir /s /q "%STAGING%"
mkdir "%STAGING%"

echo Copying files...

:: Copy backend
xcopy "%ROOT%\backend" "%STAGING%\backend\" /E /I /Q /Y >nul
:: Remove __pycache__ and venv from package
if exist "%STAGING%\backend\__pycache__" rmdir /s /q "%STAGING%\backend\__pycache__"
if exist "%STAGING%\backend\app\__pycache__" rmdir /s /q "%STAGING%\backend\app\__pycache__"
if exist "%STAGING%\backend\venv" rmdir /s /q "%STAGING%\backend\venv"
if exist "%STAGING%\backend\tests" rmdir /s /q "%STAGING%\backend\tests"
if exist "%STAGING%\backend\fitness.db" del "%STAGING%\backend\fitness.db"
if exist "%STAGING%\backend\__pycache__" rmdir /s /q "%STAGING%\backend\__pycache__"

:: Copy start.bat
copy "%ROOT%\start.bat" "%STAGING%\start.bat" >nul

:: Create zip
echo Creating zip...
powershell -NoProfile -Command "Compress-Archive -Path '%STAGING%\*' -DestinationPath '%OUTPUT%' -Force"

if errorlevel 1 (
    echo [ERROR] Failed to create zip
    rmdir /s /q "%STAGING%"
    pause
    exit /b 1
)

:: Cleanup staging
rmdir /s /q "%STAGING%"

echo.
echo ============================================
echo   Done! Package created:
echo   %OUTPUT%
echo.
echo   To deploy on another computer:
echo   1. Install Python 3.10+ (check "Add to PATH")
echo   2. Extract the zip
echo   3. Double-click start.bat
echo ============================================
echo.

pause
