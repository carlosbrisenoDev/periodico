# Author module

## `GET /api/v1/author`
**Propósito:** listar autores (ordenados por `createdAt` desc).

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Body: none
- Params: none
- Query: none

**Respuesta común:**
- Success `200`: `[{ id, name, bio, avatarUrl, createdAt, updatedAt }]`
- Errores comunes: `500 { message: "Internal server error", error }`

## `GET /api/v1/author/:id`
**Propósito:** obtener un autor por id.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Params: `id` (string no vacío; además debe ser ObjectId válido)

**Respuesta común:**
- Success `200`: `{ id, name, bio, avatarUrl, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }` (params inválidos por schema)
  - `400 { message: "Invalid author id" }`
  - `404 { message: "Author not found" }`

## `GET /api/v1/author/:id/articles`
**Propósito:** listar artículos de un autor.

**Headers requeridos:**
- Para `scope=public` (default): ninguno
- Para `scope=all`: `Cookie: access_token=<jwt admin>`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)
- Query opcional: `scope` = `public | all` (default `public`)

**Respuesta común:**
- Success `200`: `{ author: { id, name }, scope, total, articles: [...] }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `401 { message: "Unauthorized" }` (scope=all sin cookie)
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }` (token sin rol admin)
  - `404 { message: "Author not found" }`

## `POST /api/v1/author`
**Propósito:** crear autor.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`
- `Content-Type: application/json`

**Campos requeridos:**
- Body:
  - `name` (string, min 2)
  - `bio` (string, opcional, max 500)
  - `avatarUrl` (string URL, opcional)

**Respuesta común:**
- Success `201`: `{ id, name, bio, avatarUrl }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`

## `PATCH /api/v1/author/:id`
**Propósito:** actualizar autor.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`
- `Content-Type: application/json`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)
- Body (todos opcionales): `name` (min 2), `bio` (max 500), `avatarUrl` (URL)

**Respuesta común:**
- Success `200`: `{ id, name, bio, avatarUrl, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Author not found" }`

## `DELETE /api/v1/author/:id`
**Propósito:** eliminar autor.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin>`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200`: `{ message: "Author deleted" }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Author not found" }`
