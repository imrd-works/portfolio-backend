#!/usr/bin/env bash
# Deploy a new version of the function to Yandex Cloud Functions.
# Requires the `yc` CLI: https://yandex.cloud/docs/cli/quickstart
#
# Usage:
#   FUNCTION_NAME=portfolio-contact bash scripts/deploy.sh
#
# Environment variables (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ALLOWED_ORIGIN,
# OWNER_EMAIL, OWNER_TELEGRAM) are read from your current shell / .env.
set -euo pipefail

FUNCTION_NAME="${FUNCTION_NAME:-portfolio-contact}"
RUNTIME="${RUNTIME:-nodejs18}"
ENTRYPOINT="index.handler"

# Load .env if present so the values below are available.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Make sure the bundle exists.
npm run build

# Create the function once (ignore error if it already exists).
yc serverless function create --name "$FUNCTION_NAME" 2>/dev/null || true

yc serverless function version create \
  --function-name "$FUNCTION_NAME" \
  --runtime "$RUNTIME" \
  --entrypoint "$ENTRYPOINT" \
  --memory 128m \
  --execution-timeout 10s \
  --source-path ./dist \
  --environment TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?set TELEGRAM_BOT_TOKEN}" \
  --environment TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:?set TELEGRAM_CHAT_ID}" \
  --environment ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-*}" \
  --environment OWNER_EMAIL="${OWNER_EMAIL:-}" \
  --environment OWNER_TELEGRAM="${OWNER_TELEGRAM:-}"

echo
echo "Deployed. To allow public (unauthenticated) calls, run once:"
echo "  yc serverless function allow-unauthenticated-invoke $FUNCTION_NAME"
