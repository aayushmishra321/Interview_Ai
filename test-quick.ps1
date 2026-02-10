# Quick test script for API endpoints

Write-Host "🚀 Testing Smart Interview AI Platform" -ForegroundColor Cyan
Write-Host "=" * 60

# Test 1: Backend Health
Write-Host "`n🏥 Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    Write-Host "✅ Backend Health: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health: Failed" -ForegroundColor Red
}

# Test 2: AI Server Health
Write-Host "`n🤖 Testing AI Server Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
    Write-Host "✅ AI Server Health: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Server Health: Failed" -ForegroundColor Red
}

# Test 3: Payment Plans
Write-Host "`n💳 Testing Payment Plans..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/payment/plans" -Method Get
    Write-Host "✅ Payment Plans: $($response.data.Count) plans available" -ForegroundColor Green
} catch {
    Write-Host "❌ Payment Plans: Failed" -ForegroundColor Red
}

# Test 4: User Registration
Write-Host "`n👤 Testing User Registration..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$body = @{
    email = "test$timestamp@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    if ($response.success) {
        Write-Host "✅ User Registration: Success" -ForegroundColor Green
        $global:token = $response.data.accessToken
        $global:userId = $response.data.user._id
        Write-Host "   Token: $($global:token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ User Registration: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ User Registration: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: User Login
if ($global:token) {
    Write-Host "`n🔐 Testing User Profile..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $($global:token)"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:5001/api/user/profile" -Method Get -Headers $headers
        if ($response.success) {
            Write-Host "✅ User Profile: $($response.data.email)" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ User Profile: Failed" -ForegroundColor Red
    }
}

# Test 6: Code Execution
Write-Host "`n💻 Testing Code Execution..." -ForegroundColor Yellow
$codeBody = @{
    language = "javascript"
    code = "console.log(`"Hello, World!`");"
    testCases = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/code/execute" -Method Post -Body $codeBody -ContentType "application/json"
    if ($response.success) {
        Write-Host "✅ Code Execution: Success" -ForegroundColor Green
        Write-Host "   Output: $($response.data.output)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Code Execution: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 60
Write-Host "✅ Testing Complete!" -ForegroundColor Cyan
