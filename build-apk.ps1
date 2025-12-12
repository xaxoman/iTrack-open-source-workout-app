# Build APK Automation Script

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting APK Build Process..." -ForegroundColor Cyan

# Store the root directory
$rootDir = Get-Location
$projectDir = "$rootDir\project"

if (-not (Test-Path $projectDir)) {
    Write-Error "❌ Project directory not found!"
    exit 1
}

Set-Location $projectDir

# 1. Build Web Assets
Write-Host "`n📦 Building web assets (Vite)..." -ForegroundColor Yellow
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Web build failed!"
    Set-Location $rootDir
    exit 1
}

# 2. Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
cmd /c "npx cap sync"
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Capacitor sync failed!"
    Set-Location $rootDir
    exit 1
}

# 3. Build Android APK
Write-Host "`n🤖 Building Android APK (Gradle)..." -ForegroundColor Yellow
$androidDir = "$projectDir\android"
Set-Location $androidDir

cmd /c "gradlew assembleDebug"
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Android build failed!"
    Set-Location $rootDir
    exit 1
}

# 4. Success Message
$apkPath = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"

if (Test-Path $apkPath) {
    Write-Host "`n✅ Build Successful!" -ForegroundColor Green
    Write-Host "📂 APK Location: $apkPath" -ForegroundColor White
    Set-Location $rootDir
    exit 0
}

Write-Error "❌ Build finished but APK not found at expected path."
Set-Location $rootDir
exit 1
