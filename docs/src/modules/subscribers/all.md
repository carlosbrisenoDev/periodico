# Subscribers module

## `POST /api/v1/subscribers/register` — crear suscriptor
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` si se usa como alta administrada.
- **Campos requeridos:** body `{ username: string, email: string(email), password: string(min 8), role?: 'admin'|'subscriber' }`.
- **Respuesta común:**
  - Success `201`: `{ message: 'Subscriber created', subscriber }`.
  - Errores: `400 Validation error`, `409 Email already registered | Subscriber already exists`.

## `POST /api/v1/subscribers/login` — iniciar sesión
- **Headers requeridos:** `Content-Type: application/json`.
- **Campos requeridos:** body `{ email: string(email), password: string(min 1) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Login successful', subscriber }` y set-cookie `SUBSCRIBER_COOKIE_NAME`.
  - Errores: `400 Validation error`, `401 Invalid credentials`, `403 Subscriber is inactive`.

## `POST /api/v1/subscribers/logout` — cerrar sesión
- **Headers requeridos:** `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ message: 'Logout successful' }` y clear-cookie `SUBSCRIBER_COOKIE_NAME`.
  - Errores: `401 Unauthorized/Invalid token`.

## `GET /api/v1/subscribers/me` — obtener perfil
- **Headers requeridos:** `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ subscriber }`.
  - Errores: `401 Unauthorized/Invalid token`, `403 Subscriber is inactive`, `404 Subscriber not found`.

## `PATCH /api/v1/subscribers/me` — actualizar perfil propio
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body con al menos un campo `{ username?: string(min1), email?: string(email) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Profile updated successfully', subscriber }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `404 Subscriber not found`, `409 Email or username already registered`.

## `POST /api/v1/subscribers/change-password` — cambiar contraseña propia
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body `{ currentPassword: string(min 1), newPassword: string(min 8) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Password updated successfully' }`.
  - Errores: `400 Validation error | New password must be different from current password`, `401 Unauthorized/Invalid token/Current password is incorrect`, `404 Subscriber not found`.

## `GET /api/v1/subscribers/users` — listar suscriptores (admin)
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ subscribers: [{ id,username,email,role,status,active }] }`.
  - Errores: `401 Unauthorized/Invalid token`, `403 Forbidden`.

## `PATCH /api/v1/subscribers/users/:id/role` — cambiar rol (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:**
  - params `{ id: string(min1) }`
  - body `{ role: 'admin'|'subscriber' }`
- **Respuesta común:**
  - Success `200`: `{ message: 'Subscriber role updated successfully', subscriber }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Subscriber not found`.

## `PATCH /api/v1/subscribers/users/:id/active` — activar/desactivar (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:**
  - params `{ id: string(min1) }`
  - body `{ active: boolean }`
- **Respuesta común:**
  - Success `200`: `{ message: 'Subscriber active status updated successfully', subscriber }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 Subscriber not found`.
