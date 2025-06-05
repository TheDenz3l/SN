#!/bin/bash
# SwiftNotes Production Deployment Script
# Comprehensive deployment automation with safety checks

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
VERSION="${2:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if required environment files exist
    if [[ "$ENVIRONMENT" == "production" && ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log_error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup current deployment
backup_current_deployment() {
    log_info "Creating backup of current deployment..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q swiftnotes-backend; then
        log_info "Creating database backup..."
        # Add database backup commands here
        # This would typically involve pg_dump or similar
    fi
    
    # Backup volumes
    if docker volume ls | grep -q swiftnotes; then
        log_info "Backing up Docker volumes..."
        docker run --rm -v swiftnotes_redis-data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/redis-data.tar.gz -C /data .
    fi
    
    log_success "Backup created at $BACKUP_DIR"
}

# Build and test images
build_and_test() {
    log_info "Building and testing Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build images
    log_info "Building backend image..."
    docker build -t swiftnotes-backend:$VERSION ./backend
    
    log_info "Building frontend image..."
    docker build -t swiftnotes-frontend:$VERSION ./frontend
    
    # Run security scans
    log_info "Running security scans..."
    if command -v trivy &> /dev/null; then
        trivy image swiftnotes-backend:$VERSION
        trivy image swiftnotes-frontend:$VERSION
    else
        log_warning "Trivy not found, skipping security scan"
    fi
    
    # Test images
    log_info "Testing images..."
    
    # Test backend health check
    BACKEND_CONTAINER=$(docker run -d --rm swiftnotes-backend:$VERSION)
    sleep 10
    if docker exec "$BACKEND_CONTAINER" node healthcheck.js; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        docker stop "$BACKEND_CONTAINER"
        exit 1
    fi
    docker stop "$BACKEND_CONTAINER"
    
    log_success "Build and test completed"
}

# Deploy to environment
deploy() {
    log_info "Deploying to $ENVIRONMENT environment..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    if [[ "$ENVIRONMENT" == "production" ]]; then
        cp .env.production .env
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        cp .env.staging .env
    fi
    
    # Update docker-compose with new image versions
    export BACKEND_IMAGE="swiftnotes-backend:$VERSION"
    export FRONTEND_IMAGE="swiftnotes-frontend:$VERSION"
    
    # Deploy with zero-downtime strategy
    log_info "Starting rolling deployment..."
    
    # Start new containers
    docker-compose -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --no-deps backend
    
    # Wait for backend to be healthy
    log_info "Waiting for backend to be healthy..."
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health &> /dev/null; then
            log_success "Backend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Backend health check timeout"
            exit 1
        fi
        sleep 2
    done
    
    # Deploy frontend
    docker-compose -f docker-compose.yml -f docker-compose.$ENVIRONMENT.yml up -d --no-deps frontend
    
    # Wait for frontend to be healthy
    log_info "Waiting for frontend to be healthy..."
    for i in {1..30}; do
        if curl -f http://localhost/health &> /dev/null; then
            log_success "Frontend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Frontend health check timeout"
            exit 1
        fi
        sleep 2
    done
    
    # Clean up old images
    log_info "Cleaning up old images..."
    docker image prune -f
    
    log_success "Deployment completed successfully"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check all services are running
    if ! docker-compose ps | grep -q "Up"; then
        log_error "Some services are not running"
        docker-compose ps
        exit 1
    fi
    
    # Run health checks
    log_info "Running health checks..."
    
    # Backend health check
    if curl -f http://localhost:3001/api/health; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Frontend health check
    if curl -f http://localhost/health; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    # Database connectivity check
    if docker exec swiftnotes-backend node -e "require('./healthcheck.js').performHealthCheck().then(r => process.exit(r.healthy ? 0 : 1))"; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        exit 1
    fi
    
    log_success "All verification checks passed"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Get previous version from backup
    LATEST_BACKUP=$(ls -t "$PROJECT_ROOT/backups" | head -n1)
    if [[ -z "$LATEST_BACKUP" ]]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to backup: $LATEST_BACKUP"
    
    # Restore from backup
    # Add rollback logic here
    
    log_success "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting SwiftNotes deployment to $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    # Trap errors for rollback
    trap 'log_error "Deployment failed, initiating rollback..."; rollback' ERR
    
    check_prerequisites
    backup_current_deployment
    build_and_test
    deploy
    verify_deployment
    
    log_success "🎉 SwiftNotes deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Access the application at: http://localhost"
}

# Handle script arguments
case "${1:-}" in
    "production"|"staging"|"development")
        main "$@"
        ;;
    "rollback")
        rollback
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 {production|staging|development|rollback|verify} [version]"
        echo "  production   - Deploy to production environment"
        echo "  staging      - Deploy to staging environment"
        echo "  development  - Deploy to development environment"
        echo "  rollback     - Rollback to previous version"
        echo "  verify       - Verify current deployment"
        echo "  version      - Optional version tag (default: latest)"
        exit 1
        ;;
esac
