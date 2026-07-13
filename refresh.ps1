# ============================================
# PAYSBILLZ - REFRESH DASHBOARD
# Inlomax + Strongmb Data Plans
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PAYSBILLZ - REFRESH DASHBOARD" -ForegroundColor Cyan
Write-Host "  Inlomax + Strongmb Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Check if server is running
Write-Host "`n🔍 Checking server status..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -ErrorAction Stop
    Write-Host "✅ Server is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is NOT running!" -ForegroundColor Red
    Write-Host "💡 Start your server first: node server.js" -ForegroundColor Yellow
    exit
}

# 2. Login to get fresh token
Write-Host "`n🔐 Logging in..." -ForegroundColor Yellow

$login = @{
    phone = "08012345678"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body $login
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Test Inlomax API
Write-Host "`n📡 Testing Inlomax API..." -ForegroundColor Yellow

try {
    $inlomaxTest = Invoke-RestMethod -Uri "http://localhost:3000/api/data/plans" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($inlomaxTest.success) {
        $inlomaxCount = $inlomaxTest.total
        Write-Host "✅ Inlomax: $inlomaxCount plans" -ForegroundColor Green
        $networks = $inlomaxTest.data.PSObject.Properties.Name
        Write-Host "   Networks: $($networks -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "❌ Inlomax failed: $($inlomaxTest.message)" -ForegroundColor Red
        $inlomaxCount = 0
    }
} catch {
    Write-Host "❌ Inlomax error: $($_.Exception.Message)" -ForegroundColor Red
    $inlomaxCount = 0
}

# 4. Test Strongmb API
Write-Host "`n📡 Testing Strongmb API..." -ForegroundColor Yellow

try {
    $strongmbTest = Invoke-RestMethod -Uri "http://localhost:3000/api/strongmb/plans" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($strongmbTest.success) {
        $strongmbCount = $strongmbTest.data.all.Count
        Write-Host "✅ Strongmb: $strongmbCount plans" -ForegroundColor Green
        Write-Host "   SME Plans: $($strongmbTest.data.sme.Count)" -ForegroundColor Gray
        
        if ($strongmbTest.data.all.Count -gt 0) {
            Write-Host "`n📋 Sample Strongmb Plans:" -ForegroundColor Yellow
            $strongmbTest.data.all | Select-Object -First 5 | ForEach-Object {
                Write-Host "   - $($_.name): ₦$($_.price) ($($_.validity))" -ForegroundColor White
            }
        }
    } else {
        Write-Host "⚠️ Strongmb API: $($strongmbTest.message)" -ForegroundColor Yellow
        $strongmbCount = 0
    }
} catch {
    Write-Host "⚠️ Strongmb error: $($_.Exception.Message)" -ForegroundColor Yellow
    $strongmbCount = 0
}

# 5. Fund Wallet
Write-Host "`n💰 Funding wallet..." -ForegroundColor Yellow

try {
    $fundBody = @{ amount = 5000 } | ConvertTo-Json
    $fundResult = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/direct-fund" `
      -Method POST `
      -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
      -Body $fundBody
    
    Write-Host "✅ Wallet funded: ₦$($fundResult.data.newBalance)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not fund wallet" -ForegroundColor Yellow
}

# 6. Check Balance
Write-Host "`n💰 Checking balance..." -ForegroundColor Yellow

try {
    $balanceResult = Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/balance" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "✅ Balance: ₦$($balanceResult.balance)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not check balance" -ForegroundColor Yellow
    $balanceResult = @{ balance = 0 }
}

# 7. Show Combined Summary
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "  📊 DATA PLANS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📶 Inlomax: $inlomaxCount plans" -ForegroundColor White
Write-Host "📶 Strongmb: $strongmbCount plans" -ForegroundColor White
Write-Host "💰 Balance: ₦$($balanceResult.balance)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 8. Open Dashboard with Cache Busting
Write-Host "`n🌐 Opening dashboard..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$dashboardUrl = "http://localhost:3000/dashboard.html?v=$timestamp"

try {
    Start-Process $dashboardUrl
    Write-Host "✅ Dashboard opened!" -ForegroundColor Green
    Write-Host "📱 URL: $dashboardUrl" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ Could not open browser automatically" -ForegroundColor Yellow
    Write-Host "📱 Manually open: $dashboardUrl" -ForegroundColor White
}

# 9. Instructions
Write-Host "`n📋 INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Login with: 08012345678 / password123" -ForegroundColor White
Write-Host "2. Look for BOTH Inlomax and Strongmb plans" -ForegroundColor White
Write-Host "3. Strongmb plans show '⚡ Strongmb' badge" -ForegroundColor Green
Write-Host "4. If only Inlomax shows, press Ctrl+F5" -ForegroundColor Yellow

# 10. Copy token to clipboard
try {
    $token | Set-Clipboard
    Write-Host "`n📋 Token copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "`n⚠️ Could not copy token to clipboard" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ REFRESH COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
