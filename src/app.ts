import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';

import { articlesCollection } from './modules/article/article.model.js';

import authRoutes from './modules/auth/index.js';
import { env } from './config.js';
import dashboardRoutes from './modules/dashboard/index.js';
import authorRoutes from './modules/author/index.js';
import categoryRoutes from './modules/category/index.js';
import socialRoutes from './modules/social/index.js';
import imageRoutes from './modules/image/index.js';
import articleRoutes from './modules/article/index.js';
import favoritesRoutes from './modules/favorites/index.js';
import publicRoutes from './modules/public/index.js';
import subscriberRoutes from './modules/subscribers/index.js';
import reportRoutes from './modules/report/index.js';
import commentRoutes from './modules/comments/index.js';
import citizenReportRoutes from './modules/citizen_reports/index.js';
import auditRoutes from './modules/audit/index.js';
import videoRoutes from './modules/video/index.js';
import { settingsRoutes } from './modules/settings/index.js';
import { corsMiddleware } from './middlewares/cors.js';
import { validateToken } from './middlewares/validateToken.js';

export const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: false,
  contentSecurityPolicy: false
}));
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: `${env.MAX_UPLOAD_MB}mb` }));

// Archivos estáticos de subidas
app.use('/uploads', express.static(path.resolve('uploads')));

// Healthcheck
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ==========================================
// 1. RUTAS DEL BACKEND (API)
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/author', authorRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/image', imageRoutes);
app.use('/api/v1/article', articleRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/subscribers', subscriberRoutes);
app.use('/api/v1', reportRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/citizen-reports', citizenReportRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/video', validateToken, videoRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Manejador 404 exclusivo para la API
// Evita que peticiones erróneas a /api respondan con un index.html
app.all(/^\/api\//, (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// ==========================================
// 2. RUTAS DEL FRONTEND (Archivos Estáticos y SPA)
// ==========================================
const frontendPath = path.resolve('../periodico-ia-front/dist');

// Sirve los assets estáticos (CSS, JS, imágenes del frontend)
app.use(express.static(frontendPath));

// Catch-all: Cualquier petición GET que no haya caído en la API ni en estáticos,
// devuelve el index.html para que el enrutador del frontend (React/Vue/etc.) tome el control.

app.get('/articulo/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const query: any[] = [{ slug }];
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      query.push({ _id: slug as any });
    }
    
    const article = await articlesCollection().findOne({ $or: query });
    
    if (!article) {
      return res.sendFile(path.join(frontendPath, 'index.html'));
    }

    let html = fs.readFileSync(path.join(frontendPath, 'index.html'), 'utf8');

    const title = article.title ? `${article.title} | Información de Altura` : "Información de Altura";
    let plainTextContent = article.excerpt || "Contenido de alta calidad en Información de Altura";

    // Reemplaza comillas para no romper el HTML
    plainTextContent = plainTextContent.replace(/"/g, '&quot;');
    const safeTitle = title.replace(/"/g, '&quot;');

    const host = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = article.featuredImageUrl 
      ? (article.featuredImageUrl.startsWith('http') ? article.featuredImageUrl : `${host}${article.featuredImageUrl.startsWith('/') ? '' : '/'}${article.featuredImageUrl}`)
      : `${host}/default-share.jpg`;

    const url = `${host}/articulo/${article.slug || article._id}`;

    const metaTags = `
      <title>${safeTitle}</title>
      <meta name="description" content="${plainTextContent}">
      <meta property="og:type" content="article">
      <meta property="og:title" content="${safeTitle}">
      <meta property="og:description" content="${plainTextContent}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="${url}">
      <meta property="og:site_name" content="Información de Altura">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${safeTitle}">
      <meta name="twitter:description" content="${plainTextContent}">
      <meta name="twitter:image" content="${imageUrl}">
    `;

    html = html.replace('</head>', `${metaTags}</head>`);
    
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ==========================================
// 3. MANEJADORES DE ERRORES GLOBALES
// ==========================================

// Fallback 404 para cualquier otro método (POST, PUT, DELETE) fuera de /api
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Manejador de errores del servidor (500)
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: 'Internal server error', error: error.message });
});
