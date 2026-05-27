@echo off
chcp 65001 >nul

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"

echo ============================================
echo    AI Health Diet - Starting...
echo ============================================
echo.

:: Check python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+ and add to PATH.
    echo         https://www.python.org/downloads/
    echo.
    goto :fail
)

echo [OK] Python found:
python --version
echo.

:: Create venv if not exists
if exist "%BACKEND%\venv\Scripts\python.exe" goto :venv_ok
echo [INFO] First run - creating virtual environment...
python -m venv "%BACKEND%\venv"
if errorlevel 1 (
    echo [ERROR] Failed to create venv
    goto :fail
)
echo [OK] venv created
echo.
:venv_ok

:: Activate venv
call "%BACKEND%\venv\Scripts\activate.bat"

:: Install deps if not done
if exist "%BACKEND%\venv\.deps_installed" goto :deps_ok
echo [INFO] Installing dependencies (first time only, may take 1-2 minutes)...
pip install -r "%BACKEND%\requirements.txt" --quiet --no-cache-dir
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    goto :fail
)
echo done > "%BACKEND%\venv\.deps_installed"
echo [OK] Dependencies installed
echo.
:deps_ok

:: Kill old backend server only (not all python)
echo Cleaning old processes...
for /f "tokens=2" %%a in ('tasklist /fi "windowtitle eq AI-Health-Diet-Server" /fo list 2^>nul ^| findstr "PID"') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start backend server
echo Starting server...
start "AI-Health-Diet-Server" /D "%BACKEND%" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Wait for server
echo     Waiting for server...
set TRY=0

:wait_server
set /a TRY+=1
if %TRY% gtr 30 (
    echo     [WARN] Server not ready after 30s. Check the server window for errors.
    goto :done
)
timeout /t 1 /nobreak >nul
curl -s http://localhost:8000/api/health >nul 2>&1
if errorlevel 1 goto :wait_server
echo     Server ready!

:done
echo.
echo ============================================
echo   All done!
echo.
echo   Open browser: http://localhost:8000
echo   LAN access:   http://YOUR_IP:8000
echo ============================================
echo.

start http://localhost:8000
pause
exit /b 0

:fail
echo.
echo Press any key to exit...
pause >nul
exit /b 1
