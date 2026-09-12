#!/usr/bin/env bash
# Re-deploys after you've uploaded new code (via git pull, scp, or rsync).
# Run this on the server from the project folder:
#   ./deploy/update.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> Installing dependencies..."
npm install

echo "==> Building..."
npm run build

echo "==> Reloading app (zero-downtime)..."
pm2 reload deploy/ecosystem.config.js

echo "✅ Deployed."
