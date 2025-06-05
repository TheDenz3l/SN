# SwiftNotes Production Deployment Script (PowerShell)
# Comprehensive deployment automation with safety checks

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging", "development")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ErrorActionPreference = "Stop"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    try {
        $dockerVersion = docker --version
        Write-Info "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    
    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker is not running"
        exit 1
    }
    
    # Check if Docker Compose is available
    try {
        $composeVersion = docker-compose --version
        Write-Info "Docker Compose found: $composeVersion"
    }
    catch {
        try {
            $composeVersion = docker compose version
            Write-Info "Docker Compose found: $composeVersion"
        }
        catch {
            Write-Error "Docker Compose is not available"
            exit 1
        }
    }
    
    # Check if required environment files exist
    if ($Environment -eq "production" -and !(Test-Path "$ProjectRoot\.env.production")) {
        Write-Error "Production environment file (.env.production) not found"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Backup current deployment
function Backup-CurrentDeployment {
    Write-Info "Creating backup of current deployment..."
    
    $BackupDir = "$ProjectRoot\backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup database
    $backendContainer = docker ps --filter "name=swiftnotes-backend" --format "{{.Names}}"
    if ($backendContainer) {
        Write-Info "Creating database backup..."
        # Add database backup commands here
    }
    
    # Backup volumes
    $volumes = docker volume ls --filter "name=swiftnotes" --format "{{.Name}}"
    if ($volumes) {
        Write-Info "Backing up Docker volumes..."
        foreach ($volume in $volumes) {
            docker run --rm -v "${volume}:/data" -v "${BackupDir}:/backup" alpine tar czf "/backup/${volume}.tar.gz" -C /data .
        }
    }
    
    Write-Success "Backup created at $BackupDir"
}

# Build and test images
function Build-AndTest {
    Write-Info "Building and testing Docker images..."
    
    Set-Location $ProjectRoot
    
    # Build images
    Write-Info "Building backend image..."
    docker build -t "swiftnotes-backend:$Version" ./backend
    
    Write-Info "Building frontend image..."
    docker build -t "swiftnotes-frontend:$Version" ./frontend
    
    # Run security scans
    Write-Info "Running security scans..."
    if (Get-Command trivy -ErrorAction SilentlyContinue) {
        trivy image "swiftnotes-backend:$Version"
        trivy image "swiftnotes-frontend:$Version"
    }
    else {
        Write-Warning "Trivy not found, skipping security scan"
    }
    
    # Test images
    Write-Info "Testing images..."
    
    # Test backend health check
    $backendContainer = docker run -d --rm "swiftnotes-backend:$Version"
    Start-Sleep -Seconds 10
    
    try {
        $healthCheck = docker exec $backendContainer node healthcheck.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend health check passed"
        }
        else {
            Write-Error "Backend health check failed"
            docker stop $backendContainer
            exit 1
        }
    }
    finally {
        docker stop $backendContainer | Out-Null
    }
    
    Write-Success "Build and test completed"
}

# Deploy to environment
function Deploy-ToEnvironment {
    Write-Info "Deploying to $Environment environment..."
    
    Set-Location $ProjectRoot
    
    # Copy environment file
    if ($Environment -eq "production") {
        Copy-Item ".env.production" ".env" -Force
    }
    elseif ($Environment -eq "staging") {
        Copy-Item ".env.staging" ".env" -Force
    }
    
    # Set environment variables for docker-compose
    $env:BACKEND_IMAGE = "swiftnotes-backend:$Version"
    $env:FRONTEND_IMAGE = "swiftnotes-frontend:$Version"
    
    # Deploy with zero-downtime strategy
    Write-Info "Starting rolling deployment..."
    
    # Start new backend container
    docker-compose -f docker-compose.yml up -d --no-deps backend
    
    # Wait for backend to be healthy
    Write-Info "Waiting for backend to be healthy..."
    $healthyBackend = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is healthy"
                $healthyBackend = $true
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        if ($i -eq 30) {
            Write-Error "Backend health check timeout"
            exit 1
        }
        Start-Sleep -Seconds 2
    }
    
    # Deploy frontend
    docker-compose -f docker-compose.yml up -d --no-deps frontend
    
    # Wait for frontend to be healthy
    Write-Info "Waiting for frontend to be healthy..."
    $healthyFrontend = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend is healthy"
                $healthyFrontend = $true
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        if ($i -eq 30) {
            Write-Error "Frontend health check timeout"
            exit 1
        }
        Start-Sleep -Seconds 2
    }
    
    # Clean up old images
    Write-Info "Cleaning up old images..."
    docker image prune -f | Out-Null
    
    Write-Success "Deployment completed successfully"
}

# Post-deployment verification
function Test-Deployment {
    Write-Info "Verifying deployment..."
    
    # Check all services are running
    $services = docker-compose ps
    if ($services -notmatch "Up") {
        Write-Error "Some services are not running"
        docker-compose ps
        exit 1
    }
    
    # Run health checks
    Write-Info "Running health checks..."
    
    # Backend health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend health check passed"
        }
        else {
            Write-Error "Backend health check failed"
            exit 1
        }
    }
    catch {
        Write-Error "Backend health check failed: $($_.Exception.Message)"
        exit 1
    }
    
    # Frontend health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend health check passed"
        }
        else {
            Write-Error "Frontend health check failed"
            exit 1
        }
    }
    catch {
        Write-Error "Frontend health check failed: $($_.Exception.Message)"
        exit 1
    }
    
    Write-Success "All verification checks passed"
}

# Main deployment flow
function Start-Deployment {
    Write-Info "Starting SwiftNotes deployment to $Environment"
    Write-Info "Version: $Version"
    
    try {
        Test-Prerequisites
        Backup-CurrentDeployment
        Build-AndTest
        Deploy-ToEnvironment
        Test-Deployment
        
        Write-Success "🎉 SwiftNotes deployment completed successfully!"
        Write-Info "Environment: $Environment"
        Write-Info "Version: $Version"
        Write-Info "Access the application at: http://localhost"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Warning "Consider running rollback if needed"
        exit 1
    }
}

# Execute deployment
Start-Deployment
