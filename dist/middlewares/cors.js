import cors from 'cors';
import { env } from '../config.js';
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);
const allowAnyOrigin = allowedOrigins.includes('*');
const isDev = env.NODE_ENV === 'development';
const isDevOrigin = (origin) => {
    try {
        const { hostname } = new URL(origin);
        return (hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname === '::1' ||
            hostname.endsWith('.localhost') ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname));
    }
    catch {
        return false;
    }
};
export const corsMiddleware = cors({
    credentials: true,
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowAnyOrigin) {
            callback(null, true);
            return;
        }
        const requestOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(requestOrigin) || (isDev && isDevOrigin(requestOrigin))) {
            callback(null, true);
            return;
        }
        if (isDev) {
            process.stderr.write(`[CORS] Rejected origin in development: ${origin}\n`);
        }
        callback(null, false);
    }
});
