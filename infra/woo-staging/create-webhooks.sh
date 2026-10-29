#!/bin/sh
# Runs inside the wpcli container. Idempotent: replaces the webhooks it created before.
# Needs WEBHOOK_SECRET; the Next app must be running at DELIVERY_URL (Woo pings it on save).
set -eu
: "${WEBHOOK_SECRET:?set WEBHOOK_SECRET (same value as WC_WEBHOOK_SECRET in the Next app)}"
URL="${DELIVERY_URL:-http://host.docker.internal:3111/api/revalidate}"

for id in $(wp wc webhook list --user=admin --search="Next revalidate" --field=id); do
  wp wc webhook delete "$id" --force=true --user=admin >/dev/null
done
for topic in product.created product.updated product.deleted product.restored; do
  wp wc webhook create --user=admin --name="Next revalidate ($topic)" --topic="$topic" \
    --delivery_url="$URL" --secret="$WEBHOOK_SECRET" --status=active --porcelain
done
wp wc webhook list --user=admin --fields=id,name,status,delivery_url
