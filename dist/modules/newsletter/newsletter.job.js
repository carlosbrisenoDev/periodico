import nodemailer from 'nodemailer';
import { env } from '../../config.js';
import { ArticleModel } from '../article/article.model.js';
import { SubscriberModel } from '../subscribers/subscribers.model.js';
/* ── Transporter ──────────────────────────────────────── */
const createTransport = () => nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});
/* ── Queries ──────────────────────────────────────────── */
const getTopArticles = async (count) => {
    const cutoff = new Date(Date.now() - (env.NEWSLETTER_INTERVAL_MS ?? 604_800_000));
    return ArticleModel.find({
        status: 'published',
        deletedAt: null,
        publishedAt: { $gte: cutoff },
    })
        .sort({ views: -1, publishedAt: -1 })
        .limit(count)
        .lean()
        .exec();
};
const getActiveSubscribers = async () => SubscriberModel.find({ active: true, status: 'active' })
    .select('email username')
    .lean()
    .exec();
/* ── HTML Builder ─────────────────────────────────────── */
const formatDate = (date) => new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
}).format(date);
const buildArticleRow = (article) => {
    const imageHtml = article.featuredImageUrl
        ? `<img src="${article.featuredImageUrl}" alt="${article.title}" style="width:100%;max-width:560px;height:auto;border-radius:4px;display:block;margin-bottom:16px;" />`
        : '';
    const publishedLabel = article.publishedAt
        ? formatDate(article.publishedAt)
        : formatDate(article.createdAt);
    return `
    <tr>
      <td style="padding:24px 0;border-bottom:1px solid #e5e7eb;">
        ${imageHtml}
        <h2 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#111827;font-family:'Inter',Arial,sans-serif;">
          ${article.title}
        </h2>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#374151;font-family:'Inter',Arial,sans-serif;">
          ${article.excerpt}
        </p>
        <span style="font-size:13px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">
          ${publishedLabel} · ${article.views} lecturas
        </span>
      </td>
    </tr>`;
};
const buildNewsletterHtml = (articles) => {
    const articlesHtml = articles.map(buildArticleRow).join('');
    const today = formatDate(new Date());
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Resumen Semanal — Información de Altura</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2a3f52;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;font-family:'Inter',Arial,sans-serif;letter-spacing:-0.02em;">
                INFORMACIÓN DE ALTURA
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#d1d5db;font-family:'Inter',Arial,sans-serif;">
                Resumen Semanal · ${today}
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;font-family:'Inter',Arial,sans-serif;">
                Estas son las <strong>${articles.length} noticias más relevantes</strong> de esta semana. Mantente informado con lo más importante.
              </p>
            </td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${articlesHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;border-top:2px solid #5a7a94;">
              <p style="margin:0;font-size:13px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">
                © ${new Date().getFullYear()} Información de Altura. Todos los derechos reservados.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">
                Recibiste este correo porque estás suscrito a nuestro boletín semanal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
/* ── Send Logic ───────────────────────────────────────── */
const sendNewsletter = async () => {
    const articlesCount = env.NEWSLETTER_ARTICLES_COUNT ?? 4;
    const articles = await getTopArticles(articlesCount);
    if (articles.length === 0) {
        process.stdout.write('[Newsletter] No published articles found for this period. Skipping.\n');
        return;
    }
    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
        process.stdout.write('[Newsletter] No active subscribers. Skipping.\n');
        return;
    }
    const transporter = createTransport();
    const html = buildNewsletterHtml(articles);
    const subject = `Resumen Semanal — Las ${articles.length} noticias más relevantes`;
    const from = env.EMAIL_FROM ? `"${env.EMAIL_FROM}" <${env.EMAIL_USER}>` : env.EMAIL_USER;
    let sent = 0;
    let failed = 0;
    for (const subscriber of subscribers) {
        try {
            await transporter.sendMail({
                from,
                to: subscriber.email,
                subject,
                html,
            });
            sent++;
        }
        catch (error) {
            failed++;
            const message = error instanceof Error ? error.message : String(error);
            process.stderr.write(`[Newsletter] Failed to send to ${subscriber.email}: ${message}\n`);
        }
    }
    process.stdout.write(`[Newsletter] Completed: ${sent} sent, ${failed} failed, ${articles.length} articles included.\n`);
};
/* ── Scheduler ────────────────────────────────────────── */
let intervalId = null;
export const startNewsletterJob = () => {
    const intervalMs = env.NEWSLETTER_INTERVAL_MS ?? 604_800_000; // default: 7 days
    const articlesCount = env.NEWSLETTER_ARTICLES_COUNT ?? 4;
    process.stdout.write(`[Newsletter] Job scheduled — every ${(intervalMs / 3_600_000).toFixed(1)}h, top ${articlesCount} articles\n`);
    intervalId = setInterval(() => {
        void sendNewsletter();
    }, intervalMs);
};
export const stopNewsletterJob = () => {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
};
/** Trigger manually (useful for testing). */
export const triggerNewsletter = sendNewsletter;
