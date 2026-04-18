import jwt from 'jsonwebtoken';
import {env} from '../config.js';

export type JwtPayload = {
    userId: string; email: string; role: 'admin' | 'editor';
};

export type JwtSubscriberPayload = {
    subscriberId: string; email: string; username: string;
}

export const signAuthToken = (payload: JwtPayload): string => jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
});

export const verifyAuthToken = (
    token: string
): JwtPayload =>
    jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const signSubscriberToken = (payload: JwtSubscriberPayload): string => jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
});

export const verifySubscriberToken = (
  token: string
): JwtSubscriberPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtSubscriberPayload;