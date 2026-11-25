#!/bin/bash
# Deploy Freemily Tree to an AWS S3 bucket served through CloudFront.
#
#   cp .deploy.env.example .deploy.env   # once, then fill it in
#   ./deploy.sh
#
# Settings are read from .deploy.env (not committed to git):
#   BUCKET                      S3 bucket that holds the site (required)
#   SITE_URL                    public address, e.g. https://example.com (required)
#   CLOUDFRONT_DISTRIBUTION_ID  CloudFront distribution in front of the bucket (optional)
#   CF_TOKEN, CF_ZONE_ID        Cloudflare token + zone, if Cloudflare sits in front (optional)
#
# The script uploads only the site files listed below. It never deletes anything,
# so the bucket can safely hold other content too.
#
# Hosting somewhere else (Netlify, Cloudflare Pages, GitHub Pages, any web server)?
# You don't need this script: upload the same files. See the README.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .deploy.env ]; then
  echo "Missing .deploy.env. Copy .deploy.env.example to .deploy.env and fill it in." >&2
  exit 1
fi
CLOUDFRONT_DISTRIBUTION_ID=""; CF_TOKEN=""; CF_ZONE_ID=""
# shellcheck disable=SC1091
source .deploy.env
: "${BUCKET:?Set BUCKET in .deploy.env}"
: "${SITE_URL:?Set SITE_URL in .deploy.env}"

FILES=(index.html config.js app.js onboarding.js share.js style.css manifest.json privacy.html terms.html
       robots.txt sitemap.xml favicon.ico favicon-32.png apple-touch-icon.png icon-192.png icon-512.png og-image.png)
VERSIONED=(style.css config.js app.js onboarding.js share.js)

for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "Missing $f. (config.js: copy config.example.js and fill it in.)" >&2; exit 1; }
done
for f in config.js app.js onboarding.js share.js; do node --check "$f"; done

hash_of() {
  if command -v md5 >/dev/null 2>&1; then md5 -q "$1"; else md5sum "$1" | cut -d' ' -f1; fi
}

# Versioned links: the uploaded index.html loads app.js?v=<hash> etc., so browsers
# and CDNs fetch the new files right after a deploy instead of mixing a new page
# with old cached scripts. The local index.html keeps plain names.
BUILD_INDEX="$(mktemp)"
cp index.html "$BUILD_INDEX"
for asset in "${VERSIONED[@]}"; do
  v=$(hash_of "$asset" | cut -c1-10)
  sed -e "s#\"$asset\"#\"$asset?v=$v\"#g" "$BUILD_INDEX" > "$BUILD_INDEX.tmp" && mv "$BUILD_INDEX.tmp" "$BUILD_INDEX"
done

echo "Uploading to s3://$BUCKET ..."
# --acl public-read: works with buckets that grant public read per object.
# (If your bucket uses a bucket policy and blocks ACLs, remove this flag.)
# index.html goes last, so it never points at files that aren't uploaded yet.
for f in "${FILES[@]}"; do
  [ "$f" = "index.html" ] && continue
  aws s3 cp "$f" "s3://$BUCKET/$f" --acl public-read
done
aws s3 cp "$BUILD_INDEX" "s3://$BUCKET/index.html" --acl public-read --content-type "text/html"
rm -f "$BUILD_INDEX"

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  PATHS=()
  for f in "${FILES[@]}"; do PATHS+=("/$f"); done
  PATHS+=("/")
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "${PATHS[@]}" \
    --query 'Invalidation.Id' \
    --output text)
  echo "Waiting for CloudFront invalidation ($INVALIDATION_ID) to complete..."
  aws cloudfront wait invalidation-completed --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$INVALIDATION_ID"

  echo "Checking CloudFront serves every file..."
  CF_DOMAIN=$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --query Distribution.DomainName --output text)
  for f in "${FILES[@]}"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "https://$CF_DOMAIN/$f")
    [ "$code" = "200" ] || { echo "ERROR: $f returns HTTP $code from CloudFront" >&2; exit 1; }
  done
fi

# Optional: purge Cloudflare (after CloudFront, so it doesn't re-cache old content).
# Not strictly needed thanks to the versioned links above.
if [ -n "$CF_TOKEN" ] && [ -n "$CF_ZONE_ID" ]; then
  echo "Purging Cloudflare cache..."
  curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' \
    | python3 -c "import sys,json; r=json.load(sys.stdin); ok=r.get('success'); print('Cloudflare: OK' if ok else 'Cloudflare error: ' + str(r.get('errors'))); sys.exit(0 if ok else 1)"
fi

echo "Checking the live site serves the new app.js..."
if curl -s "$SITE_URL/app.js?v=$(hash_of app.js | cut -c1-10)" | cmp -s - app.js; then
  echo "Done. Live at $SITE_URL"
else
  echo "WARNING: the live app.js differs from the local one. Check your CDN cache settings."
fi
