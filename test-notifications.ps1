# ATLAS Push Notification Test Script
# Quick and easy notification testing

Write-Host ""
Write-Host "🔔 ATLAS Push Notification Tester" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Gray
Write-Host ""

# Step 1: Check backend status
Write-Host "[1/4] Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api" -TimeoutSec 30
    Write-Host "      ✅ Backend is LIVE: $($health.service)" -ForegroundColor Green
    Write-Host "      Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "      ❌ Backend is not responding!" -ForegroundColor Red
    Write-Host "      This might mean:" -ForegroundColor Yellow
    Write-Host "         - Backend is sleeping (Render free tier)" -ForegroundColor Gray
    Write-Host "         - Network issue" -ForegroundColor Gray
    Write-Host ""
    Write-Host "      Trying to wake up backend..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    try {
        $health = Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api" -TimeoutSec 30
        Write-Host "      ✅ Backend is now LIVE!" -ForegroundColor Green
    } catch {
        Write-Host "      ❌ Still not responding. Please check Render dashboard." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 2: Get FCM token
Write-Host "[2/4] FCM Token Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "      How to get your FCM token:" -ForegroundColor Cyan
Write-Host "      1. Open: https://atlas-011.web.app" -ForegroundColor Gray
Write-Host "      2. Login to your account" -ForegroundColor Gray
Write-Host "      3. Press F12 to open DevTools" -ForegroundColor Gray
Write-Host "      4. Go to Console tab" -ForegroundColor Gray
Write-Host "      5. Look for: 'FCM Token: <token>'" -ForegroundColor Gray
Write-Host "      6. Copy the token (long string)" -ForegroundColor Gray
Write-Host ""
$token = Read-Host "      Paste your FCM token here"

if (!$token -or $token.Length -lt 100) {
    Write-Host ""
    Write-Host "      ❌ Invalid or missing token!" -ForegroundColor Red
    Write-Host "      Token should be a long string (150+ characters)" -ForegroundColor Yellow
    exit 1
}

Write-Host "      ✅ Token received (${token.Length} characters)" -ForegroundColor Green
Write-Host ""

# Step 3: Send test notification
Write-Host "[3/4] Sending test notification..." -ForegroundColor Yellow
try {
    $body = @{
        token = $token
    } | ConvertTo-Json

    $result = Invoke-RestMethod `
        -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "      ✅ Notification sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "      Response from server:" -ForegroundColor Cyan
    Write-Host "      $($result | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
} catch {
    Write-Host "      ❌ Failed to send notification!" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "      Common causes:" -ForegroundColor Yellow
    Write-Host "         - Invalid FCM token" -ForegroundColor Gray
    Write-Host "         - Token expired (logout and login again)" -ForegroundColor Gray
    Write-Host "         - Backend error (check Render logs)" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Step 4: Verification
Write-Host "[4/4] Verification" -ForegroundColor Yellow
Write-Host ""
Write-Host "      ✅ Check your device for the notification!" -ForegroundColor Green
Write-Host ""
Write-Host "      Where to look:" -ForegroundColor Cyan
Write-Host "         - Windows: Action Center (bottom right)" -ForegroundColor Gray
Write-Host "         - macOS: Notification Center (top right)" -ForegroundColor Gray
Write-Host "         - Mobile: Notification drawer" -ForegroundColor Gray
Write-Host ""
Write-Host "      If you don't see it:" -ForegroundColor Yellow
Write-Host "         1. Check browser notification permissions" -ForegroundColor Gray
Write-Host "         2. Ensure service worker is active (F12 → Application → Service Workers)" -ForegroundColor Gray
Write-Host "         3. Try refreshing the app and getting a new token" -ForegroundColor Gray
Write-Host ""

Write-Host "===================================" -ForegroundColor Gray
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Need help? Check HOW_TO_TEST_NOTIFICATIONS.md" -ForegroundColor Cyan
Write-Host ""
