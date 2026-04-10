# Periodico front-end (React)

Aplicación final en React + Vite para el periódico.
Está construida con **views y rutas reales** (sin archivos `.css`; solo estilos inline en JSX).

## Scripts

- `npm run dev`: levanta el frontend en desarrollo.
- `npm run build`: compila para producción.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: previsualiza build.

## Configuración

- Variable opcional: `VITE_API_BASE_URL` (base final de la API).
- Variable opcional: `VITE_PROXY_TARGET` (solo desarrollo, default `http://localhost:3000`).
- En `npm run dev`, `/api` y `/uploads` se proxyean al backend para compartir cookies en el navegador sin CORS manual en frontend.
- Si `VITE_API_BASE_URL` no existe, el frontend usa el mismo origen (`window.location.origin`).

## Rutas principales

- `/` home pública
- `/articulo/:slug` detalle público de artículo
- `/categoria/:slug` vista pública por categoría
- `/buscar?q=texto` búsqueda pública
- `/archivo/:year/:month` archivo mensual
- `/login` login/logout + `/auth/me`
- `/panel` resumen dashboard privado
- `/admin/articulos` gestión de artículos
- `/admin/articulos/nuevo` crear artículo
- `/admin/categorias` gestión de categorías
- `/admin/autores` gestión de autores
- `/admin/autores/nuevo` crear autor
- `/admin/imagenes` subida/listado/borrado de imágenes
- `/admin/usuarios` gestión de roles y estado activo

## Uso rápido

1. Levanta la API del periódico.
2. Ejecuta `npm run dev`.
3. Navega entre rutas y usa los formularios de cada vista.
4. Para secciones privadas/admin, inicia sesión en `/login`.
