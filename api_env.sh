#!/usr/bin/env bash
# Shared environment for API test artifacts
# Usage: source ./api_env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
COOKIE_NAME="${COOKIE_NAME:-access_token}"
COOKIE_JAR="${COOKIE_JAR:-$SCRIPT_DIR/.api.cookies.txt}"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@periodico.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin12345}"

EDITOR_EMAIL="${EDITOR_EMAIL:-editor@periodico.local}"
EDITOR_PASSWORD="${EDITOR_PASSWORD:-editor12345}"

TEST_USER_EMAIL="${TEST_USER_EMAIL:-qa.user@periodico.local}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-qaUser12345}"

TEST_CATEGORY_NAME="${TEST_CATEGORY_NAME:-Tecnologia QA}"
TEST_CATEGORY_SLUG="${TEST_CATEGORY_SLUG:-tecnologia-qa}"
TEST_CATEGORY_DESCRIPTION="${TEST_CATEGORY_DESCRIPTION:-Categoria creada por pruebas automatizadas}"

TEST_AUTHOR_NAME="${TEST_AUTHOR_NAME:-QA Reporter}"
TEST_AUTHOR_BIO="${TEST_AUTHOR_BIO:-Autor de contenido para pruebas automatizadas}"

TEST_ARTICLE_TITLE="${TEST_ARTICLE_TITLE:-Noticia de prueba automatizada}"
TEST_ARTICLE_SLUG="${TEST_ARTICLE_SLUG:-noticia-prueba-automatizada}"
TEST_ARTICLE_EXCERPT="${TEST_ARTICLE_EXCERPT:-Resumen para validar endpoints de articulos}"
TEST_ARTICLE_CONTENT="${TEST_ARTICLE_CONTENT:-Contenido de prueba para validar CRUD, estados y public endpoints.}"
TEST_SEARCH_QUERY="${TEST_SEARCH_QUERY:-prueba}"

TEST_IMAGE_JPG="${TEST_IMAGE_JPG:-$SCRIPT_DIR/test-assets/test-image.jpg}"
TEST_IMAGE_PNG="${TEST_IMAGE_PNG:-$SCRIPT_DIR/test-assets/test-image.png}"
TEST_IMAGE_WEBP="${TEST_IMAGE_WEBP:-$SCRIPT_DIR/test-assets/test-image.webp}"
TEST_IMAGE_BAD="${TEST_IMAGE_BAD:-$SCRIPT_DIR/test-assets/test-file.txt}"

VERBOSE="${VERBOSE:-0}"
FAIL_FAST="${FAIL_FAST:-0}"

REQUESTS="${REQUESTS:-100}"
CONCURRENCY="${CONCURRENCY:-10}"
