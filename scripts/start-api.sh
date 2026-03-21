#!/usr/bin/env bash
set -euo pipefail

PORT="${APP_PORT:-8081}"
HOST="${APP_HOST:-0.0.0.0}"

php artisan serve --host="$HOST" --port="$PORT"
