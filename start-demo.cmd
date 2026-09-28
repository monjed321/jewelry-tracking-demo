@echo off
cd /d "%~dp0"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" serve.py
  goto end
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 serve.py
  goto end
)
where python >nul 2>nul
if not errorlevel 1 (
  python serve.py
  goto end
)
echo Python 3 is required for the local preview. You can also use any static web server.
:end
pause
