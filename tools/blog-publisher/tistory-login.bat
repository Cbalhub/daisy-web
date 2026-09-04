@echo off
cd /d "%~dp0"
set PATH=%USERPROFILE%\.localin;%PATH%
node index.mjs --tistory-login
pause
