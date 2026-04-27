# Newsletter module

Este módulo no expone endpoints REST, sino que maneja procesos automáticos en segundo plano (Jobs y Eventos) relacionados con el envío de correos electrónicos a los suscriptores.

## Tareas programadas (Cron Jobs)

### Resumen semanal de noticias (`newsletter.job.ts`)

- **Frecuencia:** Se ejecuta periódicamente según la variable de entorno `NEWSLETTER_CRON_SCHEDULE` (ej. `0 8 * * 1` para todos los lunes a las 8 AM).
- **Límite de noticias:** Envía las `N` noticias más relevantes de la semana (por defecto las 4 principales), configurable mediante `NEWSLETTER_ARTICLE_LIMIT`.
- **Destinatarios:** Se envía automáticamente a todos los usuarios en la colección `SUBSCRIBERS` cuyo campo `active` sea `true`.
- **Contenido:** Plantilla HTML responsiva generada dinámicamente que incluye la imagen destacada, título y extracto de las publicaciones.

## Eventos por acción (Triggers)

### Correo de bienvenida (`welcome.ts`)

- **Disparador:** Se activa inmediatamente y de forma asíncrona cuando un nuevo suscriptor se registra exitosamente mediante `POST /api/v1/subscribers/register`.
- **Contenido:** Envía un correo electrónico de agradecimiento por la suscripción, indicando que el usuario comenzará a recibir los resúmenes con las noticias más relevantes. No requiere confirmación de cuenta ni verificación de email.
