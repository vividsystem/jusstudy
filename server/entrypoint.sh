#!/bin/sh
set -e
urlencode() {
  LC_ALL=C
  s="$1"; out=""
  while [ -n "$s" ]; do
    rest="${s#?}"
    c="${s%"$rest"}"
    case "$c" in
      [a-zA-Z0-9.~_-]) out="$out$c" ;;
      *) out="$out$(printf '%%%02X' "'$c")" ;;
    esac
    s="$rest"
  done
  printf '%s' "$out"
}
if [ -n "$DB_PASSWORD_FILE" ]; then
  DB_PASSWORD="$(cat "$DB_PASSWORD_FILE")"
fi
export DATABASE_URL="postgres://${DB_USER}:$(urlencode "$DB_PASSWORD")@${DB_HOST}:5432/${DB_NAME}"
exec "$@"
