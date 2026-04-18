# Auth module

## `POST /api/v1/auth/login` — iniciar sesión
- **Headers requeridos:** `Content-Type: application/json`.
- **Campos requeridos:** body `{ email: string(email), password: string(min 8) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Login successful', user }` y set-cookie `COOKIE_NAME`.
  - Errores: `400 Validation error`, `401 Invalid credentials`, `403 User is inactive`.

## `POST /api/v1/auth/register` — crear usuario (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** body `{ name(min2,max120), email, password(min8), role?: 'admin'|'editor' }`.
- **Respuesta común:**
  - Success `201`: `{ message: 'User created', user }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `409 Email already registered`.

## `POST /api/v1/auth/change-password` — cambiar contraseña propia
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body `{ currentPassword(min8), newPassword(min8, distinto) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Password updated successfully' }`.
  - Errores: `400 Validation error | New password must be different...`, `401 Unauthorized/Invalid token/Current password is incorrect`, `404 User not found`.

## `POST /api/v1/auth/logout` — cerrar sesión
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ message: 'Logout successful' }` y clear-cookie `COOKIE_NAME`.
  - Errores: `401 Unauthorized/Invalid token`.

## `GET /api/v1/auth/me` — obtener usuario autenticado
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ user }`.
  - Errores: `401 Unauthorized/Invalid token`, `404 User not found`.

## `PATCH /api/v1/auth/me` — actualizar perfil propio
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body con al menos un campo `{ name?: string(min2,max120), email?: string(email) }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Profile updated successfully', user }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `404 User not found`, `409 Email already registered`.

## `GET /api/v1/auth/users` — listar usuarios (admin)
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ users: [{ id,name,email,role,active }] }`.
  - Errores: `401 Unauthorized/Invalid token`, `403 Forbidden`.

## `PATCH /api/v1/auth/users/:id/role` — cambiar rol (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:**
  - params `{ id: string(min1) }`
  - body `{ role: 'admin'|'editor' }`
- **Respuesta común:**
  - Success `200`: `{ message: 'User role updated successfully', user }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 User not found`.

## `PATCH /api/v1/auth/users/:id/active` — activar/desactivar usuario (admin)
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <COOKIE_NAME>=<jwt>` (admin).
- **Campos requeridos:**
  - params `{ id: string(min1) }`
  - body `{ active: boolean }`
- **Respuesta común:**
  - Success `200`: `{ message: 'User active status updated successfully', user }`.
  - Errores: `400 Validation error`, `401 Unauthorized/Invalid token`, `403 Forbidden`, `404 User not found`.
