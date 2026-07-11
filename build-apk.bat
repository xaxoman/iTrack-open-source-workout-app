@echo off
setlocal

echo 🚀 Starting APK Build Process...

:: Store root directory
set "ROOT_DIR=%CD%"
set "PROJECT_DIR=%ROOT_DIR%\project"

if not exist "%PROJECT_DIR%" (
    echo ❌ Project directory not found!
    exit /b 1
)

cd "%PROJECT_DIR%"

:: 1. Build Web Assets
echo.
echo 📦 Building web assets (Vite)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Web build failed!
    cd "%ROOT_DIR%"
    exit /b 1
)

:: 2. Sync Capacitor
echo.
echo 🔄 Syncing Capacitor...
call npx cap sync
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Capacitor sync failed!
    cd "%ROOT_DIR%"
    exit /b 1
)

:: 3. Build Android APK
echo.
echo 🤖 Building Android APK (Gradle)...
cd android
call .\gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Android build failed!
    cd "%ROOT_DIR%"
    exit /b 1
)

:: 4. Success Message
set "APK_PATH=%PROJECT_DIR%\android\app\build\outputs\apk\debug\app-debug.apk"

if exist "%APK_PATH%" (
    echo.
    echo ✅ Build Successful!
    echo 📂 APK Location: %APK_PATH%
    cd "%ROOT_DIR%"
    exit /b 0
) else (
    echo.
    echo ❌ Build finished but APK not found at expected path.
    cd "%ROOT_DIR%"
    exit /b 1
)
