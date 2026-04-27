import nodemailer from 'nodemailer';
import { env } from '../../config.js';
const createTransport = () => nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: "Informacion de altura",
        pass: env.EMAIL_PASS,
    },
});
const buildWelcomeHtml = (username) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Bienvenido — Información de Altura</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2a3f52;padding:40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;font-family:'Inter',Arial,sans-serif;letter-spacing:-0.02em;">
                INFORMACIÓN DE ALTURA
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;font-family:'Inter',Arial,sans-serif;">
                ¡Gracias por suscribirte, ${username}!
              </h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;font-family:'Inter',Arial,sans-serif;">
                A partir de ahora recibirás un resumen con las noticias más relevantes directamente en tu bandeja de entrada.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;font-family:'Inter',Arial,sans-serif;">
                Nos alegra que formes parte de nuestra comunidad de lectores informados.
              </p>
              <p style="margin:0;font-size:15px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">
                — El equipo de Información de Altura
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:2px solid #5a7a94;">
              <p style="margin:0;font-size:13px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">
                © ${new Date().getFullYear()} Información de Altura. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
export const sendWelcomeEmail = async (email, username) => {
    try {
        const transporter = createTransport();
        const from = env.EMAIL_FROM ? `"${env.EMAIL_FROM}" <${env.EMAIL_USER}>` : env.EMAIL_USER;
        await transporter.sendMail({
            from,
            to: email,
            subject: '¡Bienvenido a Información de Altura!',
            html: buildWelcomeHtml(username),
        });
        process.stdout.write(`[Welcome] Email sent to ${email}\n`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[Welcome] Failed to send to ${email}: ${message}\n`);
    }
};
