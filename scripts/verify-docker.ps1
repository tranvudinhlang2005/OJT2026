<#
.SYNOPSIS
  Automated End-to-End Verification Script for Docker Deployment.
.DESCRIPTION
  Validates Compose configuration, builds images, starts containers, waits for healthchecks,
  tests Frontend delivery, Nginx reverse proxy, API endpoints, CSRF, and Admin authentication.
#>

$ErrorActionPreference = 'Stop'
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Automated Docker Deployment Verification" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Validate docker compose configuration
Write-Host "`n[Step 1/5] Validating docker-compose.yml configuration..." -ForegroundColor Yellow
$configOutput = docker compose config 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker compose config validation failed: $configOutput"
    exit 1
}
Write-Host " [PASS] Docker compose configuration is valid syntax." -ForegroundColor Green

# Step 2: Check Docker daemon
Write-Host "`n[Step 2/5] Checking Docker daemon status..." -ForegroundColor Yellow
$null = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker daemon is not running. Please start Docker Desktop to run live container tests."
    exit 2
}
Write-Host " [PASS] Docker daemon is running." -ForegroundColor Green

# Step 3: Build and start containers
Write-Host "`n[Step 3/5] Building images and starting containers in background..." -ForegroundColor Yellow
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build or start docker containers."
    exit 1
}
Write-Host " [PASS] Containers started successfully." -ForegroundColor Green

# Step 4: Wait for services & run automated tests
Write-Host "`n[Step 4/5] Waiting for services to be ready & running automated tests..." -ForegroundColor Yellow

# Wait for backend healthcheck
$backendReady = $false
$maxRetries = 40
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:8080/v3/api-docs" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($res.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch { }
    Write-Host "  Waiting for Backend & Database... ($i/$maxRetries)"
    Start-Sleep -Seconds 3
}

if (-not $backendReady) {
    Write-Error "Backend did not become healthy within timeout. Container logs:"
    docker compose logs backend
    exit 1
}
Write-Host " [PASS] Backend is healthy and OpenAPI docs are available." -ForegroundColor Green

# Test Frontend HTTP 200
Write-Host "  Testing Frontend at http://localhost:3000 ..."
$feRes = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -UseBasicParsing -TimeoutSec 5
if ($feRes.StatusCode -ne 200) {
    Write-Error "Frontend returned status $($feRes.StatusCode)"
    exit 1
}
Write-Host " [PASS] Frontend delivered React SPA successfully (HTTP 200)." -ForegroundColor Green

# Test Nginx reverse proxy CSRF & establish session
Write-Host "  Testing Nginx reverse proxy at http://localhost:3000/api/v1/auth/csrf ..."
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$csrfRes = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/csrf" -Method GET -WebSession $webSession -UseBasicParsing -TimeoutSec 10
if ($csrfRes.StatusCode -ne 200 -and $csrfRes.StatusCode -ne 204) {
    Write-Error "CSRF endpoint failed via Nginx proxy with status $($csrfRes.StatusCode)"
    exit 1
}

# Extract XSRF token
$csrfToken = ($webSession.Cookies.GetCookies("http://localhost:3000") | Where-Object { $_.Name -eq 'XSRF-TOKEN' }).Value
if (-not $csrfToken -and $csrfRes.Headers["Set-Cookie"]) {
    $rawCookie = [string]$csrfRes.Headers["Set-Cookie"]
    if ($rawCookie -match 'XSRF-TOKEN=([^;]+)') {
        $csrfToken = $Matches[1]
        $cookieObj = New-Object System.Net.Cookie('XSRF-TOKEN', $csrfToken, '/', 'localhost')
        $webSession.Cookies.Add((New-Object System.Uri("http://localhost:3000")), $cookieObj)
    }
}
Write-Host " [PASS] Nginx reverse proxy forwarded request to Backend successfully (HTTP $($csrfRes.StatusCode))." -ForegroundColor Green

# Test Login API with seeded admin account
Write-Host "  Testing Admin login authentication (admin / Demo@123)..."
$loginBody = @{
    username = "admin"
    password = "Demo@123"
} | ConvertTo-Json

$loginHeaders = @{}
if ($csrfToken) {
    $loginHeaders["X-XSRF-TOKEN"] = $csrfToken
}

$loginRes = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -Headers $loginHeaders -WebSession $webSession -UseBasicParsing -TimeoutSec 10
if ($loginRes.StatusCode -ne 200) {
    Write-Error "Login failed with status $($loginRes.StatusCode)"
    exit 1
}
Write-Host " [PASS] Admin authentication succeeded with seeded account!" -ForegroundColor Green
Write-Host "        Response payload: $($loginRes.Content)" -ForegroundColor Gray

# Step 5: Test shutdown and clean up
Write-Host "`n[Step 5/5] Testing shutdown and reset command (docker compose down -v)..." -ForegroundColor Yellow
docker compose down -v
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose down -v failed."
    exit 1
}
Write-Host " [PASS] Containers and volumes cleaned up cleanly." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
