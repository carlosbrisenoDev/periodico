import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { env } from '../../config.js';
import { signSubscriberToken } from '../../libs/jwt.js';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';
import { sendWelcomeEmail } from '../newsletter/welcome.js';
import {
  createSubscriber,
  findSubscriberByEmail,
  findSubscriberById,
  listSubscribers,
  updateOwnSubscriber,
  updateSubscriberActive,
  updateSubscriberPassword,
  updateSubscriberRole,
  SubscriberDoc
} from './subscribers.model.js';

const cookieConfig = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/'
};

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

const mapSubscriberResponse = (subscriber: SubscriberDoc) => ({
  id: subscriber._id.toString(),
  username: subscriber.username,
  email: subscriber.email,
  role: subscriber.role,
  status: subscriber.status,
  active: subscriber.active,
  age: subscriber.age,
  phone: subscriber.phone,
  location: subscriber.location
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role, age, phone, location } = req.body;

  const existingSubscriber = await findSubscriberByEmail(email);
  if (existingSubscriber) {
    res.status(409).json({ message: 'Email already registered' });
    return;
  }

  try {
    const subscriber = await createSubscriber({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      age,
      phone,
      location
    });

    // Fire-and-forget welcome email (don't block the response)
    void sendWelcomeEmail(subscriber.email, subscriber.username);

    const token = signSubscriberToken({
      subscriberId: subscriber._id.toString(),
      email: subscriber.email,
      username: subscriber.username
    });

    res.cookie(env.SUBSCRIBER_COOKIE_NAME, token, cookieConfig);
    res.status(201).json({
      message: 'Subscriber created',
      subscriber: mapSubscriberResponse(subscriber)
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Subscriber already exists' });
      return;
    }

    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const subscriber = await findSubscriberByEmail(email);
  if (!subscriber) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const validPassword = await bcrypt.compare(password, subscriber.passwordHash);
  if (!validPassword) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  if (subscriber.active === false || subscriber.status !== 'active') {
    res.status(403).json({ message: 'Subscriber is inactive' });
    return;
  }

  const token = signSubscriberToken({
    subscriberId: subscriber._id.toString(),
    email: subscriber.email,
    username: subscriber.username
  });

  res.cookie(env.SUBSCRIBER_COOKIE_NAME, token, cookieConfig);
  res.status(200).json({
    message: 'Login successful',
    subscriber: mapSubscriberResponse(subscriber)
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(env.SUBSCRIBER_COOKIE_NAME, cookieConfig);
  res.status(200).json({ message: 'Logout successful' });
};

export const me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.subscriber) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const subscriber = await findSubscriberById(req.subscriber.subscriberId);
  if (!subscriber) {
    res.status(404).json({ message: 'Subscriber not found' });
    return;
  }

  if (subscriber.active === false || subscriber.status === 'suspended') {
    res.status(403).json({ message: 'Subscriber is inactive' });
    return;
  }

  res.status(200).json({ subscriber: mapSubscriberResponse(subscriber) });
};

export const patchMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.subscriber) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { username, email } = req.body;

  try {
    const updatedSubscriber = await updateOwnSubscriber(req.subscriber.subscriberId, {
      username,
      email
    });

    if (!updatedSubscriber) {
      res.status(404).json({ message: 'Subscriber not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      subscriber: mapSubscriberResponse(updatedSubscriber)
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Email or username already registered' });
      return;
    }

    throw error;
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.subscriber) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  const subscriber = await findSubscriberById(req.subscriber.subscriberId);
  if (!subscriber) {
    res.status(404).json({ message: 'Subscriber not found' });
    return;
  }

  const currentPasswordValid = await bcrypt.compare(currentPassword, subscriber.passwordHash);
  if (!currentPasswordValid) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }

  const samePassword = await bcrypt.compare(newPassword, subscriber.passwordHash);
  if (samePassword) {
    res.status(400).json({ message: 'New password must be different from current password' });
    return;
  }

  const updated = await updateSubscriberPassword(subscriber._id.toString(), await bcrypt.hash(newPassword, 10));
  if (!updated) {
    res.status(404).json({ message: 'Subscriber not found' });
    return;
  }

  res.status(200).json({ message: 'Password updated successfully' });
};

export const getUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const subscribers = await listSubscribers();
  res.status(200).json({ subscribers: subscribers.map(mapSubscriberResponse) });
};

export const patchUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  const { role } = req.body;

  const updatedSubscriber = await updateSubscriberRole(id, role);
  if (!updatedSubscriber) {
    res.status(404).json({ message: 'Subscriber not found' });
    return;
  }

  res.status(200).json({
    message: 'Subscriber role updated successfully',
    subscriber: mapSubscriberResponse(updatedSubscriber)
  });
};

export const patchUserActive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  const { active } = req.body;

  const updatedSubscriber = await updateSubscriberActive(id, active);
  if (!updatedSubscriber) {
    res.status(404).json({ message: 'Subscriber not found' });
    return;
  }

  res.status(200).json({
    message: 'Subscriber active status updated successfully',
    subscriber: mapSubscriberResponse(updatedSubscriber)
  });
};
