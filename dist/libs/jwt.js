import jwt from 'jsonwebtoken';
import { env } from '../config.js';
export const signAuthToken = (payload) => jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
});
export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET);
export const signSubscriberToken = (payload) => jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
});
export const verifySubscriberToken = (token) => jwt.verify(token, env.JWT_SECRET);
