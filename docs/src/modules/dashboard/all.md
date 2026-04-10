# Dashboard module

## `GET /api/v1/dashboard/summary` — resumen para panel privado
- **Headers requeridos:** `Cookie: <COOKIE_NAME>=<jwt>`.
- **Campos requeridos:** ninguno.
- **Respuesta común:**
  - Success `200`: `{ counts: { draft, published, scheduled }, latestArticles: [{ id,title,slug,status,createdAt }] }`.
  - Errores: `401 Unauthorized/Invalid token`.
