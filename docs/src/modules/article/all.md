# Article module

## `GET /api/v1/article` — listar artículos
- **Headers requeridos:** ninguno.
- **Campos requeridos:** query opcional `{ status: draft|published|scheduled, q, page>=1, limit 1..100 }`.
- **Respuesta común:**
  - Success `200`: `{ items, page, limit, total, totalPages }`.
  - Errores: `400 Validation error`.

## `GET /api/v1/article/slug/:slug` — obtener por slug
- **Headers requeridos:** ninguno.
- **Campos requeridos:** params `{ slug: string(min1) }`.
- **Respuesta común:**
  - Success `200`: `article`.
  - Errores: `400 Validation error`, `404 Article not found`.

## `GET /api/v1/article/:id` — obtener por id
- **Headers requeridos:** ninguno.
- **Campos requeridos:** params `{ id: string(min1) }` (además debe ser ObjectId válido).
- **Respuesta común:**
  - Success `200`: `article`.
  - Errores: `400 Validation error | Invalid article id`, `404 Article not found`.

## `POST /api/v1/article` — crear artículo (admin|editor)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body `{ title(min3), slug?, excerpt(min3), content(min10), featuredImageUrl?, status(draft|published|scheduled=default draft), isFeatured?, authorId, categoryIds[], scheduledAt? }`.
- **Respuesta común:**
  - Success `201`: `article` (slug autogenerado/único, fechas según status).
  - Errores: `400 Validation error | Invalid authorId | Invalid categoryIds | scheduledAt inválido por status`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Author not found | One or more categories not found`, `409 Article slug already exists`.

## `PATCH /api/v1/article/:id` — actualizar artículo (admin|editor)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:**
  - params `{ id: string(min1) }` (ObjectId válido)
  - body parcial de create schema (`updateArticleSchema`).
- **Respuesta común:**
  - Success `200`: `article` actualizado.
  - Errores: `400 Validation error | Invalid article id | Invalid authorId | Invalid categoryIds | reglas scheduledAt/status`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article/Author/Categories not found`, `409 Article slug already exists`.

## `PATCH /api/v1/article/:id/status` — cambiar estado (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** params `{ id }`, body `{ status: draft|published|scheduled, scheduledAt? }`.
- **Respuesta común:**
  - Success `200`: `article` con estado actualizado.
  - Errores: `400 Validation error | Invalid article id | scheduledAt requerido/prohibido según status`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article not found` (o relaciones faltantes al publicar).

## `PATCH /api/v1/article/:id/feature` — (des)destacar artículo (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** params `{ id }`; body opcional `{ isFeatured?: boolean }` (si falta, hace toggle).
- **Respuesta común:**
  - Success `200`: `article` con `isFeatured` actualizado.
  - Errores: `400 Validation error | Invalid article id`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article not found`.

## `POST /api/v1/article/:id/publish-now` — publicar inmediatamente (admin)
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** params `{ id }`.
- **Respuesta común:**
  - Success `200`: `article` con `status='published'`, `scheduledAt=null`.
  - Errores: `400 Validation error | Invalid article id` o datos no publicables, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article/Author/Categories not found`.

## `POST /api/v1/article/:id/duplicate` — duplicar artículo (admin|editor)
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** params `{ id }`.
- **Respuesta común:**
  - Success `201`: nuevo `article` en `draft`, slug único `*-copy`, `publishedAt/scheduledAt=null`, `views=0`.
  - Errores: `400 Validation error | Invalid article id`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article not found`.

## `DELETE /api/v1/article/:id` — eliminar artículo (admin)
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** params `{ id }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Article deleted' }`.
  - Errores: `400 Validation error | Invalid article id`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Article not found`.
