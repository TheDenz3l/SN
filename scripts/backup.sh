#!/bin/bash
# SwiftNotes Backup Script
# Comprehensive backup solution for production data

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="swiftnotes_backup_$TIMESTAMP"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
}

# Backup Supabase database
backup_database() {
    log_info "Backing up Supabase database..."
    
    if [[ -z "$SUPABASE_DB_URL" ]]; then
        log_warning "SUPABASE_DB_URL not set, skipping database backup"
        return 0
    fi
    
    # Create database dump
    pg_dump "$SUPABASE_DB_URL" > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    
    if [[ $? -eq 0 ]]; then
        log_success "Database backup completed"
        
        # Compress the dump
        gzip "$BACKUP_DIR/$BACKUP_NAME/database.sql"
        log_info "Database backup compressed"
    else
        log_error "Database backup failed"
        return 1
    fi
}

# Backup Docker volumes
backup_volumes() {
    log_info "Backing up Docker volumes..."
    
    # Get list of SwiftNotes volumes
    volumes=$(docker volume ls --filter "name=swiftnotes" --format "{{.Name}}")
    
    if [[ -z "$volumes" ]]; then
        log_warning "No SwiftNotes volumes found"
        return 0
    fi
    
    for volume in $volumes; do
        log_info "Backing up volume: $volume"
        
        # Create volume backup
        docker run --rm \
            -v "$volume:/data" \
            -v "$BACKUP_DIR/$BACKUP_NAME:/backup" \
            alpine tar czf "/backup/${volume}.tar.gz" -C /data .
        
        if [[ $? -eq 0 ]]; then
            log_success "Volume $volume backed up"
        else
            log_error "Failed to backup volume $volume"
        fi
    done
}

# Backup configuration files
backup_configs() {
    log_info "Backing up configuration files..."
    
    # Create config backup directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/configs"
    
    # Backup important config files (excluding secrets)
    files_to_backup=(
        "docker-compose.yml"
        "docker-compose.production.yml"
        "monitoring/prometheus.yml"
        "monitoring/alert_rules.yml"
        "monitoring/loki-config.yml"
        "monitoring/promtail-config.yml"
        "frontend/nginx.conf"
        "backend/package.json"
        "frontend/package.json"
    )
    
    for file in "${files_to_backup[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/$BACKUP_NAME/configs/"
            log_info "Backed up: $file"
        fi
    done
    
    log_success "Configuration files backed up"
}

# Backup application logs
backup_logs() {
    log_info "Backing up application logs..."
    
    # Create logs backup directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/logs"
    
    # Backup backend logs
    if [[ -d "$PROJECT_ROOT/backend/logs" ]]; then
        cp -r "$PROJECT_ROOT/backend/logs"/* "$BACKUP_DIR/$BACKUP_NAME/logs/" 2>/dev/null || true
        log_info "Backend logs backed up"
    fi
    
    # Backup container logs
    containers=$(docker ps --filter "name=swiftnotes" --format "{{.Names}}")
    for container in $containers; do
        log_info "Backing up logs for container: $container"
        docker logs "$container" > "$BACKUP_DIR/$BACKUP_NAME/logs/${container}.log" 2>&1
    done
    
    log_success "Application logs backed up"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/$BACKUP_NAME/manifest.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "version": "1.0.0",
  "components": {
    "database": $([ -f "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz" ] && echo "true" || echo "false"),
    "volumes": $([ -d "$BACKUP_DIR/$BACKUP_NAME" ] && find "$BACKUP_DIR/$BACKUP_NAME" -name "*.tar.gz" | wc -l || echo "0"),
    "configs": $([ -d "$BACKUP_DIR/$BACKUP_NAME/configs" ] && find "$BACKUP_DIR/$BACKUP_NAME/configs" -type f | wc -l || echo "0"),
    "logs": $([ -d "$BACKUP_DIR/$BACKUP_NAME/logs" ] && find "$BACKUP_DIR/$BACKUP_NAME/logs" -type f | wc -l || echo "0")
  },
  "size_bytes": $(du -sb "$BACKUP_DIR/$BACKUP_NAME" | cut -f1),
  "checksum": "$(find "$BACKUP_DIR/$BACKUP_NAME" -type f -exec md5sum {} \; | md5sum | cut -d' ' -f1)"
}
EOF
    
    log_success "Backup manifest created"
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    if [[ $? -eq 0 ]]; then
        # Remove uncompressed backup
        rm -rf "$BACKUP_NAME"
        log_success "Backup compressed: ${BACKUP_NAME}.tar.gz"
        
        # Display backup size
        backup_size=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
        log_info "Backup size: $backup_size"
    else
        log_error "Failed to compress backup"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "swiftnotes_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    log_success "Old backups cleaned up"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    if [[ -n "$BACKUP_CLOUD_PROVIDER" ]]; then
        log_info "Uploading backup to cloud storage..."
        
        case "$BACKUP_CLOUD_PROVIDER" in
            "aws")
                if command -v aws &> /dev/null; then
                    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://$BACKUP_S3_BUCKET/swiftnotes/"
                    log_success "Backup uploaded to AWS S3"
                else
                    log_warning "AWS CLI not found, skipping cloud upload"
                fi
                ;;
            "gcp")
                if command -v gsutil &> /dev/null; then
                    gsutil cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "gs://$BACKUP_GCS_BUCKET/swiftnotes/"
                    log_success "Backup uploaded to Google Cloud Storage"
                else
                    log_warning "gsutil not found, skipping cloud upload"
                fi
                ;;
            *)
                log_warning "Unknown cloud provider: $BACKUP_CLOUD_PROVIDER"
                ;;
        esac
    fi
}

# Main backup function
main() {
    log_info "Starting SwiftNotes backup process..."
    log_info "Backup name: $BACKUP_NAME"
    
    create_backup_dir
    backup_database
    backup_volumes
    backup_configs
    backup_logs
    create_manifest
    compress_backup
    cleanup_old_backups
    upload_to_cloud
    
    log_success "🎉 Backup completed successfully!"
    log_info "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
}

# Handle script arguments
case "${1:-}" in
    "database")
        create_backup_dir
        backup_database
        ;;
    "volumes")
        create_backup_dir
        backup_volumes
        ;;
    "configs")
        create_backup_dir
        backup_configs
        ;;
    "logs")
        create_backup_dir
        backup_logs
        ;;
    *)
        main
        ;;
esac
