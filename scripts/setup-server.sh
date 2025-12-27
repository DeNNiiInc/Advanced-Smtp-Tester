#!/bin/bash

# Exit on error
set -e

APP_NAME="Advanced-Smtp-Tester"
APP_DIR="/var/www/$APP_NAME"

echo "🚀 Starting Server Setup for $APP_NAME..."

# 1. Install Dependencies
echo "📦 Installing system dependencies..."
apt-get update
# Note: nodejs and npm should be present in the TurnKey Node.js template
apt-get install -y git nginx curl build-essential

# Install PM2 globally if not exists
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# 1.1 Install Cloudflared (Optional but recommended)
echo "☁️ Installing Cloudflared..."
mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | tee /etc/apt/sources.list.d/cloudflared.list
apt-get update && apt-get install -y cloudflared

# 2. Setup Nginx
echo "⚙️ Configuring Nginx..."
cp "$APP_DIR/config/nginx.conf.template" "/etc/nginx/sites-available/$APP_NAME"
# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/nodejs # Common in TurnKey
# Enable site
ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
# Test and Reload
nginx -t && systemctl reload nginx

# 3. Setup PM2
echo "⚙️ Configuring PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# 4. Setup Cron Job for Auto-Sync (Every 5 minutes)
echo "⏰ Setting up Auto-Sync Cron Job..."
SCRIPT_PATH="$APP_DIR/scripts/sync-and-restart.sh"
chmod +x "$SCRIPT_PATH"

# Add to crontab if not already there
(crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_PATH") | awk '!x[$0]++' | crontab -

echo "✅ Setup Complete! Application is running and auto-sync is enabled."
echo "🌐 Access your app at http://<YOUR_SERVER_IP>"
