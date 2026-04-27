import { env } from '../config.js';
import { verifyAuthToken, verifySubscriberToken } from '../libs/jwt.js';
export const validateToken = (req, res, next) => {
    try {
        const token = req.cookies?.[env.COOKIE_NAME];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        req.user = verifyAuthToken(token);
        next();
    }
    catch (_error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
export const validateSubscriber = (req, res, next) => {
    try {
        const token = req.cookies?.[env.SUBSCRIBER_COOKIE_NAME];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        req.subscriber = verifySubscriberToken(token);
        next();
    }
    catch (_error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
