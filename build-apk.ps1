# Build APK Automation Script

Write-Host "🚀 Starting APK Build Process..." -ForegroundColor Cyan

# Store the root directory
$rootDir = Get-Location

# Navigate to project directory
$projectDir = Join-Path $rootDir "project"
if (Test-Path $projectDir) {
    Set-Location $projectDir
} else {
    Write-Error "❌ Project directory not found!"
    exit 1
}

# 1. Build Web Assets
Write-Host "`n📦 Building web assets (Vite)..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }
} catch {
    Write-Error "❌ Web build failed!"
    Set-Location $rootDir
    exit 1
}

# 2. Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
try {
    npx cap sync
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }
} catch {
    Write-Error "❌ Capacitor sync failed!"
    Set-Location $rootDir
    exit 1
}

# 3. Build Android APK
Write-Host "`n🤖 Building Android APK (Gradle)..." -ForegroundColor Yellow
$androidDir = Join-Path $projectDir "android"
Set-Location $androidDir

try {
    ./gradlew assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
} catch {
    Write-Error "❌ Android build failed!"
    Set-Location $rootDir
    exit 1
}

# 4. Success Message
$apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "`n✅ Build Successful!" -ForegroundColor Green
    Write-Host "📂 APK Location: $apkPath" -ForegroundColor White
    
    # Optional: Open the folder containing the APK
    # Invoke-Item (Split-Path $apkPath)
} else {
    Write-Error "❌ Build finished but APK not found at expected path."
}

# Return to root
Set-Location $rootDir
