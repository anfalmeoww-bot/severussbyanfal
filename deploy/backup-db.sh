#!/usr/bin/env bash
# Backs up the SQLite database (your entire store: products, orders, users)
# to a timestamped file in ~/severusbyanfal-backups, and deletes backups
# older than 30 days.
#
# Set this up to run daily with cron:
#   crontab -e
#   # then add this line (adjust the path to where you uploaded the app):
#   0 3 * * * /home/YOUR_USER/severus-by-anfal/deploy/backup-db.sh >> /home/YOUR_USER/severusbyanfal-backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

BACKUP_DIR="$HOME/severusbyanfal-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
cp data/store.db "$BACKUP_DIR/store-$TIMESTAMP.db"
echo "Backed up data/store.db -> $BACKUP_DIR/store-$TIMESTAMP.db"

# Keep the last 30 days of backups only.
find "$BACKUP_DIR" -name "store-*.db" -mtime +30 -delete
