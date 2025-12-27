#!/bin/bash

# Configuration
APP_DIR="/var/www/Advanced-Smtp-Tester"
LOG_FILE="/var/log/smtp-tester-sync.log"

# Add /usr/local/bin to PATH to ensure PM2 is found
export PATH=$PATH:/usr/local/bin

# Navigate to app directory
cd "$APP_DIR" || exit 1

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Checking for updates..."

# Fetch latest changes
git fetch origin

# Check if we are behind
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u}) # This gets the upstream commit for the current branch

if [ "$LOCAL" != "$REMOTE" ]; then
    log "Changes detected. Updating..."
    
    # Force reset to match origin (avoids merge conflicts)
    git reset --hard origin/main >> "$LOG_FILE" 2>&1
    
    # Check if package.json changed (compare old local HEAD with new remote HEAD)
    # Note: git diff --name-only $LOCAL $REMOTE would compare the old local HEAD with the new remote HEAD
    # After git reset --hard, HEAD is already at REMOTE.
    # To check if package.json changed *between the old state and the new state*,
    # we need to compare the old LOCAL with the new REMOTE.
    if git diff --name-only "$LOCAL" "$REMOTE" | grep "package.json"; then
        log "package.json changed. Installing dependencies..."
        npm install >> "$LOG_FILE" 2>&1
    fi
    
    log "Restarting application..."
    pm2 restart Advanced-Smtp-Tester >> "$LOG_FILE" 2>&1
    
    log "Update complete."
else
    # Uncomment next line for verbose logging of no-changes
    # log "No changes detected."
    # echo "No changes."
    log "No changes found."
fi
