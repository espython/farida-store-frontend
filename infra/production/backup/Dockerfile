# Nightly encrypted, off-site backups of the WordPress database and wp-content with restic.
FROM restic/restic:0.17.3
RUN apk add --no-cache mariadb-client tzdata
COPY backup.sh restore.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
