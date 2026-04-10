# Category module

## `GET /api/v1/category`
**Propósito:** listar categorías (ordenadas por `createdAt` desc).

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Body: none
- Params: none
- Query: none

**Respuesta común:**
- Success `200`: `[{ id, name, slug, description, createdAt, updatedAt }]`
- Errores comunes: `500 { message: "Internal server error", error }`

## `GET /api/v1/category/slug/:slug`
**Propósito:** obtener categoría por slug.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Params: `slug` (string no vacío; lookup con trim/lowercase)

**Respuesta común:**
- Success `200`: `{ id, name, slug, description, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid category slug" }`
  - `404 { message: "Category not found" }`

## `GET /api/v1/category/:id`
**Propósito:** obtener categoría por id.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200`: `{ id, name, slug, description, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid category id" }`
  - `404 { message: "Category not found" }`

## `POST /api/v1/category`
**Propósito:** crear categoría con slug normalizado (`slug` o `name`).

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`
- `Content-Type: application/json`

**Campos requeridos:**
- Body:
  - `name` (string, min 2)
  - `slug` (string, opcional, min 2)
  - `description` (string, opcional, max 300)

**Respuesta común:**
- Success `201`: `{ id, name, slug, description }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `409 { message: "Category slug already exists" }`

## `PATCH /api/v1/category/:id`
**Propósito:** actualizar categoría (recalcula slug si llega `slug` o `name`).

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`
- `Content-Type: application/json`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)
- Body (todos opcionales): `name` (min 2), `slug` (min 2), `description` (max 300)

**Respuesta común:**
- Success `200`: `{ id, name, slug, description, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid category id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Category not found" }`
  - `409 { message: "Category slug already exists" }`

## `DELETE /api/v1/category/:id`
**Propósito:** eliminar categoría.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200`: `{ message: "Category deleted" }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid category id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Category not found" }`
