#!/usr/bin/env bash
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/api_env.sh"

ADMIN_COOKIE_JAR="$COOKIE_JAR"
EDITOR_COOKIE_JAR="${COOKIE_JAR}.editor"

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
LAST_STATUS=""
LAST_BODY=""

CATEGORY_ID=""
AUTHOR_ID=""
IMAGE_ID=""
IMAGE_URL=""
ARTICLE_ID=""
ARTICLE_SLUG=""
DUPLICATED_ARTICLE_ID=""
USER_ID=""
EDITOR_USER_ID=""

print_section() {
  printf '\n============================================================\n'
  printf '%s\n' "$1"
  printf '============================================================\n'
}

print_result() {
  local label="$1"
  local expected="$2"
  local ok=0

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  IFS='|' read -r -a expected_codes <<< "$expected"

  for code in "${expected_codes[@]}"; do
    if [[ "$LAST_STATUS" == "$code" ]]; then
      ok=1
      break
    fi
  done

  if [[ "$ok" -eq 1 ]]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    printf '[PASS] %s (status=%s expected=%s)\n' "$label" "$LAST_STATUS" "$expected"
  else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    printf '[FAIL] %s (status=%s expected=%s)\n' "$label" "$LAST_STATUS" "$expected"
    if [[ "$FAIL_FAST" == "1" ]]; then
      printf 'FAIL_FAST=1 -> aborting\n'
      exit 1
    fi
  fi
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    printf 'jq is required. Install it and retry.\n'
    exit 1
  fi
}

require_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    printf 'Required file not found: %s\n' "$file_path"
    exit 1
  fi
}

request_json() {
  local method="$1"
  local endpoint="$2"
  local payload="${3:-}"
  local use_cookie="${4:-1}"
  local cookie_jar="${5:-$ADMIN_COOKIE_JAR}"
  local url="${BASE_URL}${endpoint}"
  local body_file
  body_file="$(mktemp)"

  local -a curl_args
  curl_args=(-sS -X "$method" "$url" -o "$body_file" -w '%{http_code}')

  if [[ "$use_cookie" == "1" ]]; then
    curl_args+=(-b "$cookie_jar" -c "$cookie_jar")
  fi

  if [[ -n "$payload" ]]; then
    curl_args+=(-H 'Content-Type: application/json' --data "$payload")
  fi

  LAST_STATUS="$(curl "${curl_args[@]}" 2>/dev/null || printf '000')"
  LAST_BODY="$(cat "$body_file")"
  rm -f "$body_file"

  printf 'Request: %s %s\n' "$method" "$endpoint"
  printf 'Status : %s\n' "$LAST_STATUS"
  printf 'Body   : %s\n' "$LAST_BODY"
}

request_form() {
  local method="$1"
  local endpoint="$2"
  local field_name="$3"
  local file_path="$4"
  local mime_type="${5:-application/octet-stream}"
  local use_cookie="${6:-1}"
  local cookie_jar="${7:-$ADMIN_COOKIE_JAR}"
  local url="${BASE_URL}${endpoint}"
  local body_file
  body_file="$(mktemp)"

  local -a curl_args
  curl_args=(-sS -X "$method" "$url" -o "$body_file" -w '%{http_code}' -F "${field_name}=@${file_path};type=${mime_type}")

  if [[ "$use_cookie" == "1" ]]; then
    curl_args+=(-b "$cookie_jar" -c "$cookie_jar")
  fi

  LAST_STATUS="$(curl "${curl_args[@]}" 2>/dev/null || printf '000')"
  LAST_BODY="$(cat "$body_file")"
  rm -f "$body_file"

  printf 'Request: %s %s (form file=%s)\n' "$method" "$endpoint" "$file_path"
  printf 'Status : %s\n' "$LAST_STATUS"
  printf 'Body   : %s\n' "$LAST_BODY"
}

extract_json() {
  local jq_filter="$1"
  printf '%s' "$LAST_BODY" | jq -r "$jq_filter // empty"
}

prepare_test_assets() {
  mkdir -p "$(dirname "$TEST_IMAGE_PNG")"

  if [[ ! -f "$TEST_IMAGE_PNG" ]]; then
    printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8B9o4AAAAASUVORK5CYII=' | base64 -d > "$TEST_IMAGE_PNG"
  fi

  if [[ ! -f "$TEST_IMAGE_JPG" ]]; then
    printf '%s' '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUVFRUVFRUXFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OFQ8QFysdFR0rKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAABQIDBAEGB//EADQQAAEDAgMFBQcDBQAAAAAAAAEAAgMEEQUSITFBUQYTMnGBkRQjQlKhsdHwFSNSYnLx/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAJxEBAAICAQQCAgMAAAAAAAAAAAECERMhEjEEQVEiMmEEMnGRsfD/2gAMAwEAAhEDEQA/APjKKKKACiiigAooooAKKKKACiiigAooooA//2Q==' | base64 -d > "$TEST_IMAGE_JPG"
  fi

  if [[ ! -f "$TEST_IMAGE_WEBP" ]]; then
    printf '%s' 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEALmk0mk0iIiIiIgBoSywA' | base64 -d > "$TEST_IMAGE_WEBP"
  fi

  if [[ ! -f "$TEST_IMAGE_BAD" ]]; then
    printf 'not-an-image\n' > "$TEST_IMAGE_BAD"
  fi
}

safe_delete() {
  local endpoint="$1"
  local label="$2"
  request_json DELETE "$endpoint" "" 1 "$ADMIN_COOKIE_JAR"
  print_result "$label" '200|404|400'
}

require_jq
prepare_test_assets
require_file "$TEST_IMAGE_JPG"
require_file "$TEST_IMAGE_PNG"
require_file "$TEST_IMAGE_WEBP"
require_file "$TEST_IMAGE_BAD"

rm -f "$ADMIN_COOKIE_JAR" "$EDITOR_COOKIE_JAR"

RUN_ID="$(date +%s)"
CATEGORY_SLUG="${TEST_CATEGORY_SLUG}-${RUN_ID}"
ARTICLE_SLUG_BASE="${TEST_ARTICLE_SLUG}-${RUN_ID}"
ARTICLE_TITLE_RUN="${TEST_ARTICLE_TITLE} ${RUN_ID}"
SCHEDULED_AT="$(date -u -d '+1 day' '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ')"
ARCHIVE_YEAR="$(date -u '+%Y')"
ARCHIVE_MONTH="$(date -u '+%-m')"
EDITOR_NEW_PASSWORD="${EDITOR_PASSWORD}_new"

print_section 'Negative smoke: invalid login + protected endpoint without cookie'
request_json POST '/auth/login' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password\"}" 0
print_result 'Invalid login' '401'

request_json GET '/dashboard/summary' '' 0
print_result 'Protected endpoint without cookie' '401'

print_section 'Admin login and auth checks'
request_json POST '/auth/login' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Admin login' '200'

request_json GET '/auth/me' '' 1 "$ADMIN_COOKIE_JAR"
print_result 'Auth me' '200'

print_section 'User management: register, list, role, active, forbidden'
request_json POST '/auth/register' "{\"name\":\"Editor QA\",\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_PASSWORD\",\"role\":\"editor\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Register editor user' '201|409'

request_json POST '/auth/register' "{\"name\":\"Test User\",\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"role\":\"editor\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Register test user' '201|409'

request_json GET '/auth/users' '' 1 "$ADMIN_COOKIE_JAR"
print_result 'List users' '200'

EDITOR_USER_ID="$(printf '%s' "$LAST_BODY" | jq -r --arg email "$EDITOR_EMAIL" '.users[]? | select(.email==$email) | .id' | head -n1)"
USER_ID="$(printf '%s' "$LAST_BODY" | jq -r --arg email "$TEST_USER_EMAIL" '.users[]? | select(.email==$email) | .id' | head -n1)"

if [[ -n "$USER_ID" ]]; then
  request_json PATCH "/auth/users/${USER_ID}/role" '{"role":"editor"}' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Update user role' '200'

  request_json PATCH "/auth/users/${USER_ID}/active" '{"active":true}' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Update user active' '200'
else
  printf '[WARN] userId not found for %s, skipping role/active updates\n' "$TEST_USER_EMAIL"
fi

request_json POST '/auth/login' "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_PASSWORD\"}" 1 "$EDITOR_COOKIE_JAR"
print_result 'Editor login' '200'

request_json GET '/auth/users' '' 1 "$EDITOR_COOKIE_JAR"
print_result 'Forbidden editor on admin endpoint' '403'

request_json POST '/auth/change-password' "{\"currentPassword\":\"$EDITOR_PASSWORD\",\"newPassword\":\"$EDITOR_NEW_PASSWORD\"}" 1 "$EDITOR_COOKIE_JAR"
print_result 'Editor change password' '200'

request_json POST '/auth/login' "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_NEW_PASSWORD\"}" 1 "$EDITOR_COOKIE_JAR"
print_result 'Editor login with new password' '200'

request_json POST '/auth/change-password' "{\"currentPassword\":\"$EDITOR_NEW_PASSWORD\",\"newPassword\":\"$EDITOR_PASSWORD\"}" 1 "$EDITOR_COOKIE_JAR"
print_result 'Editor revert password' '200'

print_section 'Category endpoints'
request_json POST '/category' "{\"name\":\"${TEST_CATEGORY_NAME} ${RUN_ID}\",\"slug\":\"$CATEGORY_SLUG\",\"description\":\"$TEST_CATEGORY_DESCRIPTION\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Create category' '201'
CATEGORY_ID="$(extract_json '.id')"

request_json POST '/category' "{\"name\":\"A\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Invalid category body' '400'

request_json POST '/category' "{\"name\":\"Duplicate category\",\"slug\":\"$CATEGORY_SLUG\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Duplicate category slug' '409'

request_json GET '/category' '' 0
print_result 'List categories' '200'

request_json GET '/category/not-an-id' '' 0
print_result 'Category invalid id' '400'

request_json GET '/category/slug/%20' '' 0
print_result 'Category invalid slug' '400'

if [[ -n "$CATEGORY_ID" ]]; then
  request_json GET "/category/$CATEGORY_ID" '' 0
  print_result 'Get category by id' '200'

  request_json GET "/category/slug/$CATEGORY_SLUG" '' 0
  print_result 'Get category by slug' '200'

  request_json PATCH "/category/$CATEGORY_ID" "{\"description\":\"Categoria actualizada $RUN_ID\"}" 1 "$ADMIN_COOKIE_JAR"
  print_result 'Update category' '200'
else
  printf '[WARN] categoryId missing, skipping category get/update\n'
fi

print_section 'Author endpoints'
request_json POST '/author' "{\"name\":\"${TEST_AUTHOR_NAME} ${RUN_ID}\",\"bio\":\"$TEST_AUTHOR_BIO\"}" 1 "$ADMIN_COOKIE_JAR"
print_result 'Create author' '201'
AUTHOR_ID="$(extract_json '.id')"

request_json GET '/author' '' 0
print_result 'List authors' '200'

request_json GET '/author/not-an-id' '' 0
print_result 'Author invalid id' '400'

if [[ -n "$AUTHOR_ID" ]]; then
  request_json GET "/author/$AUTHOR_ID" '' 0
  print_result 'Get author by id' '200'

  request_json GET "/author/$AUTHOR_ID/articles" '' 0
  print_result 'Author articles public scope' '200'

  request_json GET "/author/$AUTHOR_ID/articles?scope=all" '' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Author articles all scope (admin)' '200'

  request_json PATCH "/author/$AUTHOR_ID" "{\"bio\":\"Bio actualizada ${RUN_ID}\"}" 1 "$ADMIN_COOKIE_JAR"
  print_result 'Update author' '200'
else
  printf '[WARN] authorId missing, skipping author get/update\n'
fi

print_section 'Image endpoints'
request_json GET '/image?limit=5' '' 1 "$ADMIN_COOKIE_JAR"
print_result 'List images' '200'

request_form POST '/image/upload' 'image' "$TEST_IMAGE_PNG" 'image/png' 1 "$ADMIN_COOKIE_JAR"
print_result 'Upload PNG image' '201'
IMAGE_ID="$(extract_json '.id')"
IMAGE_URL="$(extract_json '.url')"

request_form POST '/image/upload' 'image' "$TEST_IMAGE_BAD" 'text/plain' 1 "$ADMIN_COOKIE_JAR"
print_result 'Upload invalid file type' '400|500'

print_section 'Article endpoints'
if [[ -n "$AUTHOR_ID" && -n "$CATEGORY_ID" ]]; then
  request_json POST '/article' "{\"title\":\"$ARTICLE_TITLE_RUN\",\"slug\":\"$ARTICLE_SLUG_BASE\",\"excerpt\":\"$TEST_ARTICLE_EXCERPT\",\"content\":\"$TEST_ARTICLE_CONTENT\",\"featuredImageUrl\":\"$IMAGE_URL\",\"status\":\"draft\",\"isFeatured\":false,\"authorId\":\"$AUTHOR_ID\",\"categoryIds\":[\"$CATEGORY_ID\"]}" 1 "$ADMIN_COOKIE_JAR"
  print_result 'Create draft article' '201'
  ARTICLE_ID="$(extract_json '.id')"
  ARTICLE_SLUG="$(extract_json '.slug')"
else
  printf '[WARN] missing author/category IDs, skipping article create\n'
fi

request_json POST '/article' '{"title":"x","excerpt":"x","content":"x","authorId":"bad","categoryIds":[]}' 1 "$ADMIN_COOKIE_JAR"
print_result 'Invalid article body' '400'

request_json GET '/article?status=draft&q=prueba&page=1&limit=10' '' 0
print_result 'List articles with filters' '200'

request_json GET '/article/not-an-id' '' 0
print_result 'Article invalid id' '400'

if [[ -n "$ARTICLE_ID" ]]; then
  request_json GET "/article/$ARTICLE_ID" '' 0
  print_result 'Get article by id' '200'

  request_json GET "/article/slug/$ARTICLE_SLUG" '' 0
  print_result 'Get article by slug' '200'

  request_json PATCH "/article/$ARTICLE_ID" "{\"excerpt\":\"Excerpt actualizado ${RUN_ID}\",\"content\":\"Contenido actualizado ${RUN_ID}\"}" 1 "$ADMIN_COOKIE_JAR"
  print_result 'Update article' '200'

  request_json PATCH "/article/$ARTICLE_ID/feature" '{}' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Feature article' '200'

  request_json PATCH "/article/$ARTICLE_ID/status" '{"status":"scheduled"}' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Status scheduled without scheduledAt (negative)' '400'

  request_json PATCH "/article/$ARTICLE_ID/status" "{\"status\":\"scheduled\",\"scheduledAt\":\"$SCHEDULED_AT\"}" 1 "$ADMIN_COOKIE_JAR"
  print_result 'Set article scheduled' '200'

  request_json PATCH "/article/$ARTICLE_ID/status" '{"status":"draft"}' 1 "$EDITOR_COOKIE_JAR"
  print_result 'Forbidden editor on status endpoint' '403'

  request_json POST "/article/$ARTICLE_ID/duplicate" '' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Duplicate article' '201'
  DUPLICATED_ARTICLE_ID="$(extract_json '.id')"

  request_json POST "/article/$ARTICLE_ID/publish-now" '' 1 "$ADMIN_COOKIE_JAR"
  print_result 'Publish article now' '200'
else
  printf '[WARN] articleId missing, skipping article-specific operations\n'
fi

print_section 'Dashboard endpoint'
request_json GET '/dashboard/summary' '' 1 "$ADMIN_COOKIE_JAR"
print_result 'Dashboard summary' '200'

print_section 'Public endpoints'
request_json GET '/public/home' '' 0
print_result 'Public home' '200'

request_json GET '/public/categories' '' 0
print_result 'Public categories' '200'

request_json GET '/public/featured' '' 0
print_result 'Public featured' '200'

request_json GET '/public/latest' '' 0
print_result 'Public latest' '200'

request_json GET '/public/trending?limit=5' '' 0
print_result 'Public trending' '200'

request_json GET "/public/archive/${ARCHIVE_YEAR}/${ARCHIVE_MONTH}" '' 0
print_result 'Public archive' '200'

request_json GET '/public/sitemap' '' 0
print_result 'Public sitemap' '200'

if [[ -n "$ARTICLE_SLUG" ]]; then
  request_json GET "/public/article/$ARTICLE_SLUG" '' 0
  print_result 'Public article by slug' '200'
else
  printf '[WARN] articleSlug missing, skipping /public/article/:slug\n'
fi

request_json GET "/public/category/$CATEGORY_SLUG" '' 0
print_result 'Public category by slug' '200|404'

request_json GET "/public/search?q=${TEST_SEARCH_QUERY}&limit=5" '' 0
print_result 'Public search' '200'

print_section 'Cleanup'
if [[ -n "$DUPLICATED_ARTICLE_ID" ]]; then
  safe_delete "/article/$DUPLICATED_ARTICLE_ID" 'Cleanup duplicated article'
fi

if [[ -n "$ARTICLE_ID" ]]; then
  safe_delete "/article/$ARTICLE_ID" 'Cleanup article'
fi

if [[ -n "$IMAGE_ID" ]]; then
  safe_delete "/image/$IMAGE_ID" 'Cleanup image'
fi

if [[ -n "$AUTHOR_ID" ]]; then
  safe_delete "/author/$AUTHOR_ID" 'Cleanup author'
fi

if [[ -n "$CATEGORY_ID" ]]; then
  safe_delete "/category/$CATEGORY_ID" 'Cleanup category'
fi

request_json POST '/auth/logout' '' 1 "$ADMIN_COOKIE_JAR"
print_result 'Admin logout' '200'

request_json POST '/auth/logout' '' 1 "$EDITOR_COOKIE_JAR"
print_result 'Editor logout' '200'

print_section 'Summary'
printf 'Total checks : %s\n' "$TOTAL_CHECKS"
printf 'Passed       : %s\n' "$PASSED_CHECKS"
printf 'Failed       : %s\n' "$FAILED_CHECKS"
printf 'Captured IDs : category=%s author=%s image=%s article=%s duplicated=%s user=%s\n' \
  "$CATEGORY_ID" "$AUTHOR_ID" "$IMAGE_ID" "$ARTICLE_ID" "$DUPLICATED_ARTICLE_ID" "$USER_ID"

if [[ "$FAILED_CHECKS" -gt 0 ]]; then
  exit 1
fi
