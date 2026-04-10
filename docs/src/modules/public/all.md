# Public module

## `GET /api/v1/public/home` — bloques para home pública
- **Headers requeridos:** ninguno.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ recent, featured, latest }`.
  - Errores comunes: `500 Internal server error`.

## `GET /api/v1/public/categories` — categorías con conteo publicado
- **Headers requeridos:** ninguno.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `[{ id,name,slug,description,articleCount }]` (o `[]`).
  - Errores comunes: `500 Internal server error`.

## `GET /api/v1/public/featured` — artículos destacados públicos
- **Headers requeridos:** ninguno.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `article[]` (hasta 5).
  - Errores comunes: `500 Internal server error`.

## `GET /api/v1/public/latest` — artículos recientes públicos
- **Headers requeridos:** ninguno.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `article[]` (hasta 8).
  - Errores comunes: `500 Internal server error`.

## `GET /api/v1/public/trending` — artículos por vistas
- **Headers requeridos:** ninguno.
- **Campos requeridos:** query opcional `{ limit: int 1..50 }` (default controlador: 10).
- **Respuesta común:**
  - Success `200`: `article[]` ordenado por `views desc`.
  - Errores: `400 Validation error`.

## `GET /api/v1/public/archive/:year/:month` — archivo mensual
- **Headers requeridos:** ninguno.
- **Campos requeridos:** params `{ year: YYYY, month: 1..12 }`.
- **Respuesta común:**
  - Success `200`: `{ year, month, total, items }`.
  - Errores: `400 Validation error`.

## `GET /api/v1/public/sitemap` — listado de URLs públicas API
- **Headers requeridos:** ninguno.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ generatedAt, total, urls }`.
  - Errores comunes: `500 Internal server error`.

## `GET /api/v1/public/article/:slug` — artículo público por slug
- **Headers requeridos:** ninguno.
- **Campos requeridos:** params `{ slug: string(min1) }`.
- **Respuesta común:**
  - Success `200`: `article` (incrementa `views` en +1).
  - Errores: `400 Validation error`, `404 Article not found`.

## `GET /api/v1/public/category/:slug` — artículos por categoría
- **Headers requeridos:** ninguno.
- **Campos requeridos:** params `{ slug: string(min1) }`.
- **Respuesta común:**
  - Success `200`: `{ category, articles }`.
  - Errores: `400 Validation error`, `404 Category not found`.

## `GET /api/v1/public/search` — búsqueda pública
- **Headers requeridos:** ninguno.
- **Campos requeridos:** query `{ q: string(min1), limit?: int 1..50 (default 10) }`.
- **Respuesta común:**
  - Success `200`: `{ q, total, items }`.
  - Errores: `400 Validation error`.
