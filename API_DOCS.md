# Documentación de Endpoints (Analytics y Dashboard)

Esta documentación describe las rutas disponibles en tu ecosistema para interactuar con la analítica.

---

## 1. Backend Central (Express - Periodico)
**Base URL:** `http://localhost:3000`

Este es tu recolector de datos principal. Aquí llegan todas las peticiones desde tu Frontend React. Todo se almacena en la colección `analytics_logs` en MongoDB.

### 1.1 `POST /api/v1/analytics/views`
Registra que un usuario vio una página.
**Body (JSON):**
```json
{
  "url": "/contacto"
}
```

### 1.2 `POST /api/v1/analytics/tabs`
Registra interacciones dentro de la UI, como cambiar de pestaña o abrir modales.
**Body (JSON):**
```json
{
  "url": "/servicios",
  "tabName": "Precios"
}
```

### 1.3 `POST /api/v1/analytics/navigation`
Registra los saltos de navegación de una página a otra (Journey del usuario).
**Body (JSON):**
```json
{
  "from": "/",
  "to": "/servicios"
}
```

### 1.4 `GET /api/v1/analytics/logs`
Obtiene el historial crudo de interacciones para mostrar en el panel de administrador interno.
**Query Params (Opcionales):**
- `type`: "view", "tab", o "navigation".
- `limit`: (default: 1000)
- `skip`: (default: 0)

---

## 2. Dashboard Visualizador (Laravel)
**Base URL:** `http://localhost:8000`  
**Headers Requeridos:** `X-API-KEY: <tu-api-key>`

Laravel ya no guarda los datos del tráfico, sino que **los consume del Backend Express (`localhost:3000/api/v1/analytics/logs`)** y los procesa para crear estadísticas, porcentajes y gráficas de la UI.

### 2.1 `GET /api/v1/analytics/dashboard/overview`
Retorna el resumen ejecutivo principal, incluyendo el tráfico procesado, embudo dinámico y zonas de fricción basados en la API de Express.
