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

:: 3. Locate a Java 21 JDK (required by the Capacitor Android toolchain)
echo.
echo ☕ Locating Java 21 (required by Gradle toolchain)...
set "JAVA21_HOME="

:: Prefer JAVA_HOME if it already points at a Java 21 install
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" (
    "%JAVA_HOME%\bin\java.exe" -version 2>&1 | findstr /r /c:"version .21\." >nul && set "JAVA21_HOME=%JAVA_HOME%"
)

:: Otherwise probe common locations (Android Studio's bundled JBR is Java 21)
if not defined JAVA21_HOME (
    for %%D in (
        "%ProgramFiles%\Android\Android Studio\jbr"
        "%LOCALAPPDATA%\Programs\Android Studio\jbr"
        "%ProgramFiles%\Java\jdk-21"
        "%ProgramFiles%\Eclipse Adoptium\jdk-21"
        "%ProgramFiles%\Microsoft\jdk-21"
    ) do (
        if not defined JAVA21_HOME if exist "%%~D\bin\java.exe" (
            "%%~D\bin\java.exe" -version 2>&1 | findstr /r /c:"version .21\." >nul && set "JAVA21_HOME=%%~D"
        )
    )
)

if not defined JAVA21_HOME (
    echo ❌ Could not find a Java 21 JDK.
    echo    Install JDK 21 ^(or Android Studio^) and set JAVA_HOME to it, then retry.
    cd "%ROOT_DIR%"
    exit /b 1
)

echo    Using Java 21 at: %JAVA21_HOME%
set "JAVA_HOME=%JAVA21_HOME%"

:: 4. Build Android APK
echo.
echo 🤖 Building Android APK (Gradle)...
cd android
call .\gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Android build failed!
    cd "%ROOT_DIR%"
    exit /b 1
)

:: 5. Success Message
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
