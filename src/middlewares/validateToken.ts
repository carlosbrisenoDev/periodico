import {NextFunction, Request, Response} from 'express';
import {env} from '../config.js';
import {JwtPayload, JwtSubscriberPayload, verifyAuthToken, verifySubscriberToken} from '../libs/jwt.js';

export type AuthenticatedRequest = Request & {
    user?: JwtPayload;
    subscriber?: JwtSubscriberPayload;
};

export const validateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.[env.COOKIE_NAME];

        if (!token) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        req.user = verifyAuthToken(token);
        next();
    } catch (_error) {
        res.status(401).json({message: 'Invalid token'});
    }
};

export const validateSubscriber = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.[env.SUBSCRIBER_COOKIE_NAME];
        if (!token) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        req.subscriber = verifySubscriberToken(token);
        next()
    } catch (_error) {
        res.status(401).json({message: 'Invalid token'});
    }
}