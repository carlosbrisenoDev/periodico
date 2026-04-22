# Social module

## `GET /api/v1/social`
**Propósito:** listar redes sociales de autores, opcionalmente filtrando por `authorId` y/o `platform`.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Body: none
- Params: none
- Query opcional:
  - `authorId` (ObjectId válido)
  - `platform` = `facebook | twitter | x | instagram | linkedin | custom`

**Respuesta común:**
- Success `200`: `[{ id, authorId, platform, platformLabel, url, label, createdAt, updatedAt }]`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `404 { message: "Author not found" }` cuando se filtra por un autor inexistente

## `GET /api/v1/social/author/:authorId`
**Propósito:** listar redes sociales de un autor específico.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Params: `authorId` (string no vacío; ObjectId válido)
- Query opcional: `platform` = `facebook | twitter | x | instagram | linkedin | custom`

**Respuesta común:**
- Success `200`: `{ authorId, total, items: [...] }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `404 { message: "Author not found" }`

## `GET /api/v1/social/:id`
**Propósito:** obtener una red social por id.

**Headers requeridos:** ninguno.

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200`: `{ id, authorId, platform, platformLabel, url, label, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid social id" }`
  - `404 { message: "Social not found" }`

## `POST /api/v1/social`
**Propósito:** crear una red social para un autor.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`
- `Content-Type: application/json`

**Campos requeridos:**
- Body:
  - `authorId` (ObjectId válido)
  - `platform` = `facebook | twitter | x | instagram | linkedin | custom`
  - `url` (URL válida)
  - `label` (string, opcional; requerido si `platform=custom`)

**Respuesta común:**
- Success `201`: `{ id, authorId, platform, platformLabel, url, label, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid author id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Author not found" }`
  - `409 { message: "Social link already exists" }`

## `PATCH /api/v1/social/:id`
**Propósito:** actualizar una red social.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`
- `Content-Type: application/json`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)
- Body (todos opcionales): `authorId`, `platform`, `url`, `label`

**Respuesta común:**
- Success `200`: `{ id, authorId, platform, platformLabel, url, label, createdAt, updatedAt }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid social id" }`
  - `400 { message: "Invalid author id" }`
  - `400 { message: "Label is required for custom social links" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Social not found" }`
  - `404 { message: "Author not found" }`
  - `409 { message: "Social link already exists" }`

## `DELETE /api/v1/social/:id`
**Propósito:** eliminar una red social.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200`: `{ message: "Social deleted" }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid social id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Social not found" }`

