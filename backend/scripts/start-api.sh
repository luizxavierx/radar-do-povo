#!/usr/bin/env bash
set -euo pipefail

PORT="${APP_PORT:-8081}"
HOST="${APP_HOST:-127.0.0.1}"

php artisan serve --host="$HOST" --port="$PORT"
