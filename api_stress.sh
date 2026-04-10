#!/usr/bin/env bash
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/api_env.sh"

REQUESTS="${REQUESTS:-100}"
CONCURRENCY="${CONCURRENCY:-10}"

TOTAL_REQ=0
TOTAL_SUCCESS=0
TOTAL_FAIL=0

print_section() {
  printf '\n============================================================\n'
  printf '%s\n' "$1"
  printf '============================================================\n'
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    printf 'jq is required. Install it and retry.\n'
    exit 1
  fi
}

login_admin() {
  local body_file
  body_file="$(mktemp)"

  local status
  status="$(curl -sS -X POST "${BASE_URL}/auth/login" -H 'Content-Type: application/json' --data "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" -o "$body_file" -w '%{http_code}' 2>/dev/null || printf '000')"

  local body
  body="$(cat "$body_file")"
  rm -f "$body_file"

  printf 'Login status: %s\n' "$status"
  if [[ "$VERBOSE" == "1" ]]; then
    printf 'Login body  : %s\n' "$body"
  fi

  if [[ "$status" != '200' ]]; then
    printf 'Cannot continue stress test without admin login.\n'
    exit 1
  fi

  local message
  message="$(printf '%s' "$body" | jq -r '.message // empty' 2>/dev/null)"
  if [[ -n "$message" ]]; then
    printf 'Login message: %s\n' "$message"
  fi
}

perform_request() {
  local method="$1"
  local endpoint="$2"
  local payload="$3"
  local use_cookie="$4"

  local url="${BASE_URL}${endpoint}"
  local -a args
  args=(-sS -X "$method" "$url" -o /dev/null -w '%{http_code} %{time_total}')

  if [[ "$use_cookie" == '1' ]]; then
    args+=(-b "$COOKIE_JAR" -c "$COOKIE_JAR")
  fi

  if [[ -n "$payload" ]]; then
    args+=(-H 'Content-Type: application/json' --data "$payload")
  fi

  curl "${args[@]}" 2>/dev/null || printf '000 0'
}

summarize_block() {
  local block_name="$1"
  local result_file="$2"
  local expected_status="$3"

  local total success fail avg_time
  total="$(wc -l < "$result_file")"
  success="$(awk -v expected="$expected_status" '$1 == expected {count++} END {print count + 0}' "$result_file")"
  fail=$((total - success))
  avg_time="$(awk '{sum += $2} END {if (NR > 0) printf "%.4f", sum/NR; else printf "0.0000"}' "$result_file")"

  TOTAL_REQ=$((TOTAL_REQ + total))
  TOTAL_SUCCESS=$((TOTAL_SUCCESS + success))
  TOTAL_FAIL=$((TOTAL_FAIL + fail))

  printf 'Block            : %s\n' "$block_name"
  printf 'Total requests   : %s\n' "$total"
  printf 'Success (%s)     : %s\n' "$expected_status" "$success"
  printf 'Fail             : %s\n' "$fail"
  printf 'Avg time (sec)   : %s\n' "$avg_time"
  printf 'Status breakdown :\n'
  awk '{counts[$1]++} END {for (status in counts) printf "  - %s: %d\n", status, counts[status]}' "$result_file" | sort
}

run_stress_block() {
  local block_name="$1"
  local method="$2"
  local endpoint="$3"
  local payload="$4"
  local use_cookie="$5"
  local expected_status="$6"

  local result_file
  result_file="$(mktemp)"

  print_section "Stress block: ${block_name}"
  printf 'Endpoint: %s %s\n' "$method" "${BASE_URL}${endpoint}"
  printf 'Requests: %s | Concurrency: %s\n' "$REQUESTS" "$CONCURRENCY"

  local i
  for ((i = 1; i <= REQUESTS; i++)); do
    (
      perform_request "$method" "$endpoint" "$payload" "$use_cookie" >> "$result_file"
    ) &

    while (( $(jobs -pr | wc -l) >= CONCURRENCY )); do
      wait -n
    done
  done

  wait
  summarize_block "$block_name" "$result_file" "$expected_status"
  rm -f "$result_file"
}

require_jq
rm -f "$COOKIE_JAR"

print_section 'Admin login for authenticated stress blocks'
login_admin

LOGIN_PAYLOAD="{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"

run_stress_block 'POST /auth/login' 'POST' '/auth/login' "$LOGIN_PAYLOAD" '0' '200'
run_stress_block 'GET /auth/me' 'GET' '/auth/me' '' '1' '200'
run_stress_block 'GET /dashboard/summary' 'GET' '/dashboard/summary' '' '1' '200'
run_stress_block 'GET /public/home' 'GET' '/public/home' '' '0' '200'
run_stress_block 'GET /public/latest' 'GET' '/public/latest' '' '0' '200'
run_stress_block 'GET /article' 'GET' '/article' '' '0' '200'
run_stress_block 'GET /public/search?q=test' 'GET' '/public/search?q=test' '' '0' '200'

print_section 'Global summary'
printf 'Total requests: %s\n' "$TOTAL_REQ"
printf 'Success       : %s\n' "$TOTAL_SUCCESS"
printf 'Fail          : %s\n' "$TOTAL_FAIL"

if [[ "$TOTAL_FAIL" -gt 0 ]]; then
  exit 1
fi
