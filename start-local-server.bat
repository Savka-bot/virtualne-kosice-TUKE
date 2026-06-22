@echo off
setlocal
cd /d "%~dp0"
echo Starting local server at http://127.0.0.1:5500
echo Press Ctrl+C to stop.
python -m http.server 5500
endlocal
