#!/bin/sh
# One backup run: consistent database dump + wp-content (uploads, plugins, languages) into restic,
# then retention. Run by cron, or by hand from Coolify's terminal: backup.sh
set -eu
work=/tmp/farida-backup
rm -rf "$work" && mkdir -p "$work"
trap 'rm -rf "$work"' EXIT

echo "backup: $(date -Iseconds) dumping database"
MYSQL_PWD="$DB_PASSWORD" mariadb-dump -h "${DB_HOST:-db}" -u "$DB_USER" \
  --single-transaction --quick --no-tablespaces --default-character-set=utf8mb4 "$DB_NAME" > "$work/wordpress.sql"

restic backup --tag farida --host farida "$work/wordpress.sql" /wp/wp-content --exclude /wp/wp-content/cache
restic forget --tag farida --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune
restic check

# Optional dead-man's switch (e.g. healthchecks.io): an alert fires when this stops arriving.
[ -n "${BACKUP_PING_URL:-}" ] && wget -qO- "$BACKUP_PING_URL" >/dev/null || true
echo "backup: $(date -Iseconds) done"
