#!/bin/sh
# Creates the restic repository on first start, then runs backup.sh on BACKUP_CRON.
set -eu
: "${RESTIC_REPOSITORY:?}" "${RESTIC_PASSWORD:?}"
restic cat config >/dev/null 2>&1 || restic init
echo "${BACKUP_CRON:-30 1 * * *} /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
echo "backup: repository ready, schedule '${BACKUP_CRON:-30 1 * * *}' (${TZ:-UTC})"
exec crond -f -l 8
