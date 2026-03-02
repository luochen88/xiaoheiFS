#!/bin/sh
set -eu

APP_ADDR="${APP_ADDR:-:8080}"
APP_API_BASE_URL="${APP_API_BASE_URL:-http://localhost:8080}"
APP_JWT_SECRET="${APP_JWT_SECRET:-}"
APP_PLUGIN_MASTER_KEY="${APP_PLUGIN_MASTER_KEY:-}"
APP_PLUGINS_DIR="${APP_PLUGINS_DIR:-./backend/plugins}"
APP_DB_TYPE="${APP_DB_TYPE:-sqlite}"
APP_DB_PATH="${APP_DB_PATH:-./data/app.db}"
APP_DB_DSN="${APP_DB_DSN:-}"
APP_DB_HOST="${APP_DB_HOST:-}"
APP_DB_PORT="${APP_DB_PORT:-}"
APP_DB_NAME="${APP_DB_NAME:-}"
APP_DB_USER="${APP_DB_USER:-}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-}"
APP_DB_OPTIONS="${APP_DB_OPTIONS:-}"

if [ -z "${APP_DB_DSN}" ]; then
  case "${APP_DB_TYPE}" in
    mysql)
      DB_HOST="${APP_DB_HOST:-mysql}"
      DB_PORT="${APP_DB_PORT:-3306}"
      DB_NAME="${APP_DB_NAME:-xiaoheifs}"
      DB_USER="${APP_DB_USER:-xiaoheifs}"
      DB_PASSWORD="${APP_DB_PASSWORD:-}"
      DB_OPTIONS="${APP_DB_OPTIONS:-charset=utf8mb4&parseTime=True&loc=Local}"
      APP_DB_DSN="${DB_USER}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?${DB_OPTIONS}"
      ;;
    postgres|postgresql)
      DB_HOST="${APP_DB_HOST:-postgres}"
      DB_PORT="${APP_DB_PORT:-5432}"
      DB_NAME="${APP_DB_NAME:-xiaoheifs}"
      DB_USER="${APP_DB_USER:-xiaoheifs}"
      DB_PASSWORD="${APP_DB_PASSWORD:-}"
      DB_OPTIONS="${APP_DB_OPTIONS:-sslmode=disable TimeZone=Asia/Shanghai}"
      APP_DB_DSN="host=${DB_HOST} user=${DB_USER} password='${DB_PASSWORD}' dbname=${DB_NAME} port=${DB_PORT} ${DB_OPTIONS}"
      ;;
  esac
fi

cat > /app/app.config.yaml <<EOF
addr: "${APP_ADDR}"
api_base_url: "${APP_API_BASE_URL}"
jwt_secret: "${APP_JWT_SECRET}"
plugin_master_key: "${APP_PLUGIN_MASTER_KEY}"
plugins_dir: "${APP_PLUGINS_DIR}"
db:
  type: "${APP_DB_TYPE}"
  path: "${APP_DB_PATH}"
  dsn: "${APP_DB_DSN}"
EOF

exec /app/server
