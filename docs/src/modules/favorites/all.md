# Favorites module

## `GET /api/v1/favorites` — listar favoritos del suscriptor
- **Headers requeridos:** `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ items: [{ articleId, title, slug, excerpt, featuredImageUrl, addedAt }] }`.
  - Errores: `401 Unauthorized/Invalid token`.

## `POST /api/v1/favorites` — añadir artículo a favoritos
- **Headers requeridos:** `Content-Type: application/json`, `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** body `{ articleId: string }`.
- **Respuesta común:**
  - Success `201`: `{ message: 'Article added to favorites' }`.
  - Errores: `400 Validation error / Invalid article ID`, `401 Unauthorized`, `404 Article not found`, `409 Article already in favorites`.

## `DELETE /api/v1/favorites/:articleId` — eliminar artículo de favoritos
- **Headers requeridos:** `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** params `{ articleId: string }`.
- **Respuesta común:**
  - Success `200`: `{ message: 'Article removed from favorites' }`.
  - Errores: `400 Invalid article ID`, `401 Unauthorized`, `404 Favorite not found`.

## `GET /api/v1/favorites/is-favorite/:articleId` — comprobar si un artículo es favorito
- **Headers requeridos:** `Cookie: <SUBSCRIBER_COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** params `{ articleId: string }`.
- **Respuesta común:**
  - Success `200`: `{ isFavorite: boolean }`.
  - Errores: `400 Invalid article ID`, `401 Unauthorized`.
