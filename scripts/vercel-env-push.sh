#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.development}"
ENVIRONMENT="${2:-preview}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

echo "Pushing vars from $ENV_FILE to Vercel ($ENVIRONMENT)..."

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  echo "  → $key"
  echo "$value" | vercel env add "$key" "$ENVIRONMENT" --force
done < "$ENV_FILE"

echo "Done."
