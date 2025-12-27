#!/bin/bash

# Configuration
APP_DIR="/var/www/Advanced-Smtp-Tester"
LOG_FILE="/var/log/smtp-tester-sync.log"

# Navigate to app directory
cd "$APP_DIR" || exit 1

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Fetch latest changes
git fetch origin

# Check if there are changes
HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse origin/main)

if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    log "Changes detected. Updating..."
    
    # Pull changes
    git pull origin main >> "$LOG_FILE" 2>&1
    
    # Check if package.json changed
    if git diff --name-only "$HEADHASH" "$UPSTREAMHASH" | grep "package.json"; then
        log "package.json changed. Installing dependencies..."
        npm install >> "$LOG_FILE" 2>&1
    fi
    
    # Restart application
    log "Restarting application..."
    pm2 reload all >> "$LOG_FILE" 2>&1
    
    log "Update complete."
else
    # Uncomment next line for verbose logging of no-changes
    # log "No changes detected."
    # echo "No changes."
    :
fi
