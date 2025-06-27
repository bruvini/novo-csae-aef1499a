#!/bin/bash
# Script to set CORS for Firebase Storage bucket
# Requires gsutil from Google Cloud SDK

BUCKET="gs://csaefloripa.appspot.com"

if ! command -v gsutil >/dev/null 2>&1; then
  echo "gsutil not found. Please install the Google Cloud SDK." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Apply the CORS configuration
set -e

gsutil cors set "$SCRIPT_DIR/cors.json" "$BUCKET"

echo "CORS configuration applied to $BUCKET"

# Show the current CORS settings for verification
echo "Current CORS settings:" 
gsutil cors get "$BUCKET"
