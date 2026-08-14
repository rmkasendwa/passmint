#!/bin/sh
set -eu

export PORT="${API_PORT:-3000}"
pnpm --filter @passmint/api start &
api_pid="$!"

cleanup() {
  kill "$api_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

export PORT="${WEB_PORT:-8088}"
pnpm --filter @passmint/web preview
