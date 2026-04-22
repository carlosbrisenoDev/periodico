# Image module

## `GET /api/v1/image`
**Propósito:** listar imágenes recientes.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`

**Campos requeridos:**
- Query opcional: `limit` (int, `1..100`, default `20`)

**Respuesta común:**
- Success `200`: `[{ id, filename, url, mimeType, size, createdAt }]`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`

## `POST /api/v1/image/upload`
**Propósito:** subir imagen destacada y guardar metadata.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`
- `Content-Type: multipart/form-data`

**Campos requeridos:**
- Form-data: `image` (archivo)
- Restricciones actuales: jpg/png/webp, máximo 5MB
- Nombre de archivo generado: `<nombre_original_saneado>_<dd-mm-yyyy-hh-mm-ss-SSS>.<ext>`

**Respuesta común:**
- Success `201`: `{ id, filename, url }`
- Errores comunes:
  - `400 { message: "Image file is required" }` (sin archivo o MIME no permitido)
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `500 { message: "Internal server error", error }` (ej. límite de tamaño u otro error multer)

## `DELETE /api/v1/image/:id`
**Propósito:** eliminar registro de imagen y luego intentar borrar archivo físico.

**Headers requeridos:**
- `Cookie: access_token=<jwt admin|editor>`

**Campos requeridos:**
- Params: `id` (string no vacío; ObjectId válido)

**Respuesta común:**
- Success `200` (siempre borra DB):
  - `{ message: "Image deleted", id, file: { status: "deleted", path } }`
  - `{ message: "Image deleted from database; file was already missing", id, file: { status: "missing", path } }`
  - `{ message: "Image deleted from database; file removal failed", id, file: { status: "error", path } }`
- Errores comunes:
  - `400 { message: "Validation error", errors[] }`
  - `400 { message: "Invalid image id" }`
  - `401 { message: "Unauthorized" }`
  - `401 { message: "Invalid token" }`
  - `403 { message: "Forbidden" }`
  - `404 { message: "Image not found" }`
