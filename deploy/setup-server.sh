#!/usr/bin/env bash
#
# One-time server setup for SeverusByAnfal.
#
# WHAT THIS DOES:
#   1. Installs Node.js 22, pm2, Nginx, and Certbot (if not already present)
#   2. Installs project dependencies and builds the app
#   3. Starts the app under pm2 (auto-restarts on crash / reboot)
#   4. Configures Nginx as an HTTPS reverse proxy for your domain
#   5. Requests a free Let's Encrypt TLS certificate
#
# BEFORE YOU RUN THIS:
#   - Point your domain's DNS "A" record at this server's IP address first
#     (TLS issuance will fail otherwise).
#   - Upload this whole project folder to the server, e.g.:
#       scp -r severus-by-anfal your-user@your-server-ip:~/severus-by-anfal
#   - Create ~/severus-by-anfal/.env on the server from .env.production,
#     with every "<<< FILL IN >>>" replaced with your real values.
#
# HOW TO RUN THIS (on the server, as a user with sudo):
#   cd ~/severus-by-anfal
#   chmod +x deploy/setup-server.sh
#   ./deploy/setup-server.sh your-domain.com you@your-email.com
#
# Re-running this script later (e.g. after `git pull` / re-uploading new
# code) is safe — it just reinstalls deps, rebuilds, and reloads pm2.

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <your-domain.com> <your-email@example.com>"
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env not found."
  echo "Copy .env.production to .env and fill in every <<< FILL IN >>> value first."
  exit 1
fi

if grep -q "FILL IN" "$APP_DIR/.env"; then
  echo "ERROR: $APP_DIR/.env still has unfilled <<< FILL IN >>> placeholders."
  echo "Fill in every value in that file, then re-run this script."
  exit 1
fi

echo "==> Installing Node.js 22 (if needed)..."
if ! command -v node >/dev/null || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo "==> Installing pm2 (process manager) if needed..."
if ! command -v pm2 >/dev/null; then
  sudo npm install -g pm2
fi

echo "==> Installing Nginx + Certbot if needed..."
if ! command -v nginx >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y nginx certbot python3-certbot-nginx
fi

echo "==> Installing project dependencies..."
cd "$APP_DIR"
npm install

echo "==> Building the app..."
npm run build

echo "==> Starting/reloading the app under pm2..."
if pm2 describe severusbyanfal >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js
else
  pm2 start deploy/ecosystem.config.js
  pm2 save
  # Sets pm2 to restart the app automatically on server reboot.
  sudo env PATH="$PATH:$(dirname "$(command -v node)")" pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash || true
  pm2 save
fi

echo "==> Configuring Nginx for $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/severusbyanfal"
sed -e "s/__DOMAIN__/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf.template" | sudo tee "$NGINX_CONF" > /dev/null
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/severusbyanfal
sudo nginx -t
sudo systemctl reload nginx

echo "==> Requesting a free HTTPS certificate for $DOMAIN..."
sudo certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --redirect --non-interactive

echo ""
echo "✅ Done. Your store should now be live at: https://$DOMAIN"
echo "   Check app logs any time with:  pm2 logs severusbyanfal"
echo "   Restart the app any time with: pm2 restart severusbyanfal"
