@echo off
echo 🛑 Killing Firebase emulator processes...

REM Kill processes on specific ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9099') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5555') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9999') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4444') do taskkill /PID %%a /F 2>nul

REM Kill any remaining firebase processes
taskkill /IM node.exe /F 2>nul
taskkill /IM java.exe /F 2>nul

echo ✅ Processes killed
echo 🚀 Starting Firebase emulators with fresh rules...

REM Start emulators
firebase emulators:start

pause