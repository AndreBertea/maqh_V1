@echo off
setlocal
set SCRIPT_DIR=%~dp0
set REPO_SCRIPTS_DIR=%SCRIPT_DIR%..
powershell -ExecutionPolicy Bypass -File "%REPO_SCRIPTS_DIR%\setup.ps1" -Cmd start
endlocal


