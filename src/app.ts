import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';

import authRoutes from './modules/auth/index.js';
import dashboardRoutes from './modules/dashboard/index.js';
import authorRoutes from './modules/author/index.js';
import categoryRoutes from './modules/category/index.js';
import imageRoutes from './modules/image/index.js';
import articleRoutes from './modules/article/index.js';
import publicRoutes from './modules/public/index.js';
import subscriberRoutes from './modules/subscribers/index.js';
import { corsMiddleware } from './middlewares/cors.js';

export const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/author', authorRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/image', imageRoutes);
app.use('/api/v1/article', articleRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/subscribers', subscriberRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: 'Internal server error', error: error.message });
});
