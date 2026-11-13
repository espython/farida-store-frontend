#!/bin/sh
# Restores a snapshot over the live site: database, then wp-content.
#   restore.sh                 list snapshots
#   restore.sh <id|latest> --yes
# Stop the storefront first if customers could be ordering (doc/deploy-coolify.md, Restore).
set -eu
if [ $# -lt 2 ] || [ "$2" != "--yes" ]; then
  restic snapshots --tag farida
  echo "usage: restore.sh <snapshot id|latest> --yes   (overwrites the database and wp-content)"
  exit 1
fi
target=/tmp/farida-restore
rm -rf "$target" && mkdir -p "$target"
trap 'rm -rf "$target"' EXIT

restic restore "$1" --tag farida --target "$target"
sql="$(find "$target" -name wordpress.sql | head -1)"
[ -n "$sql" ] || { echo "no wordpress.sql in snapshot"; exit 1; }

echo "restore: importing database"
MYSQL_PWD="$DB_PASSWORD" mariadb -h "${DB_HOST:-db}" -u "$DB_USER" "$DB_NAME" < "$sql"

echo "restore: replacing wp-content"
src="$target/wp/wp-content"
find /wp/wp-content -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "$src"/. /wp/wp-content/
chown -R 33:33 /wp/wp-content
echo "restore: done from snapshot $1. Redeploy the wordpress service so the image's mu-plugins are reinstalled."
