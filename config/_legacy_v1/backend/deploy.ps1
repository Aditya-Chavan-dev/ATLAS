# Quick Deployment Script for Backend

Write-Host "`n🚀 ATLAS Backend Deployment to Render`n" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Gray

# Check if we're in the backend directory
if (!(Test-Path "server.js")) {
    Write-Host "❌ Error: Not in backend directory!" -ForegroundColor Red
    Write-Host "Please run this script from G:\ATLAS\backend`n" -ForegroundColor Yellow
    exit 1
}

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "`n📝 Uncommitted changes detected:`n" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "`nCommit these changes? (y/n)"
    
    if ($commit -eq 'y') {
        $message = Read-Host "Enter commit message"
        if (!$message) {
            $message = "Backend deployment fixes"
        }
        
        Write-Host "`n📦 Committing changes..." -ForegroundColor Yellow
        git add .
        git commit -m $message
        
        Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        Write-Host "`n✅ Changes pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Skipping commit. Deploy will use last committed version." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host "`n======================================" -ForegroundColor Gray
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Gray

Write-Host "1. Go to Render Dashboard:" -ForegroundColor White
Write-Host "   https://dashboard.render.com`n" -ForegroundColor Cyan

Write-Host "2. Select your backend service (atlas-backend)`n" -ForegroundColor White

Write-Host "3. Click 'Manual Deploy' → 'Deploy latest commit'`n" -ForegroundColor White

Write-Host "4. Watch the logs for:" -ForegroundColor White
Write-Host "   ✅ '🚀 ATLAS Backend Server is LIVE!'" -ForegroundColor Green
Write-Host "   ✅ 'Firebase services ready'" -ForegroundColor Green
Write-Host "   ✅ 'Cron jobs scheduled'`n" -ForegroundColor Green

Write-Host "5. Test the deployment:" -ForegroundColor White
Write-Host "   curl https://atlas-backend-gncd.onrender.com/`n" -ForegroundColor Cyan

Write-Host "======================================" -ForegroundColor Gray
Write-Host "📚 Troubleshooting:" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Gray

Write-Host "If deployment fails, check:" -ForegroundColor Yellow
Write-Host "• Render logs for error messages" -ForegroundColor White
Write-Host "• Environment variables are set correctly" -ForegroundColor White
Write-Host "• FIREBASE_SERVICE_ACCOUNT is valid JSON" -ForegroundColor White
Write-Host "• See RENDER_FIX.md for detailed guide`n" -ForegroundColor White

Write-Host "======================================`n" -ForegroundColor Gray
