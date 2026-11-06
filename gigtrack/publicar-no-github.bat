@echo off
REM GigTrack - primeiro envio para https://github.com/mrpaladini/gigtrack
REM Rode este arquivo dentro de C:\dev\gigtrack depois de extrair o ZIP.
cd /d "%~dp0"
where git >nul 2>nul || (echo Instale o Git: https://git-scm.com/download/win & pause & exit /b 1)
if not exist ".git" git init -b main
git add -A
git commit -m "GigTrack 1.0.0 - novo nome, Hostinger e layout para celular/tablet"
git remote get-url origin >nul 2>nul || git remote add origin https://github.com/mrpaladini/gigtrack.git
git branch -M main
git pull --rebase origin main --allow-unrelated-histories 2>nul
git push -u origin main
pause
