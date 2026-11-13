#!/bin/sh
# Installs this image's Farida mu-plugins on every start (the wp-content volume outlives the image,
# so a redeploy is how a plugin change reaches the site), then hands over to the official entrypoint.
set -eu
dir=/var/www/html/wp-content/mu-plugins
mkdir -p "$dir"
rm -f "$dir"/farida-*.php
cp /usr/src/farida-mu-plugins/farida-*.php "$dir"/
chown -R www-data:www-data /var/www/html/wp-content
exec docker-entrypoint.sh "$@"
