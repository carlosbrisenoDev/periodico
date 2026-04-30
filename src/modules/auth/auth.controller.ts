import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { MongoServerError, ObjectId } from 'mongodb';
import { env } from '../../config.js';
import { signAuthToken } from '../../libs/jwt.js';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';
import { AuthorModel } from '../author/author.model.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateOwnUser,
  updateUserActive,
  updateUserPassword,
  updateUserRole,
  UserDoc,
  deleteUserById
} from './auth.model.js';

const cookieConfig = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/'
};

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

const mapUserResponse = (user: UserDoc) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active ?? true
});

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  if (user.active === false) {
    res.status(403).json({ message: 'User is inactive' });
    return;
  }

  const token = signAuthToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  });

  res.cookie(env.COOKIE_NAME, token, cookieConfig);
  res.status(200).json({
    message: 'Login successful',
    user: mapUserResponse(user)
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(env.COOKIE_NAME, cookieConfig);
  res.status(200).json({ message: 'Logout successful' });
};

export const me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({
    user: mapUserResponse(user)
  });
};

export const patchMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { name, email } = req.body;

  try {
    const updatedUser = await updateOwnUser(req.user.userId, {
      name,
      email
    });

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: mapUserResponse(updatedUser)
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    throw error;
  }
};

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ message: 'Email already registered' });
    return;
  }

  try {
    const user = await createUser({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role
    });

    if (role === 'admin') {
      try {
        await AuthorModel.create({
          name: user.name,
          bio: 'Administrador del sistema.',
          userId: user._id
        });
      } catch (authorErr) {
        console.error('Failed to auto-create author for admin', authorErr);
      }
    }

    res.status(201).json({
      message: 'User created',
      user: mapUserResponse(user)
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    throw error;
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  const user = await findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentPasswordValid) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    res.status(400).json({ message: 'New password must be different from current password' });
    return;
  }

  const updated = await updateUserPassword(user._id.toString(), await bcrypt.hash(newPassword, 10));
  if (!updated) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({ message: 'Password updated successfully' });
};

export const getUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = await listUsers();
  res.status(200).json({ users: users.map(mapUserResponse) });
};

export const patchUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  const { role } = req.body;

  const updatedUser = await updateUserRole(id, role);
  if (!updatedUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({
    message: 'User role updated successfully',
    user: mapUserResponse(updatedUser)
  });
};

export const patchUserActive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  const { active } = req.body;

  const updatedUser = await updateUserActive(id, active);
  if (!updatedUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({
    message: 'User active status updated successfully',
    user: mapUserResponse(updatedUser)
  });
};

export const patchUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  const { name, email, role } = req.body;

  try {
    const updatedUser = await updateOwnUser(id, { name, email });
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let finalUser = updatedUser;
    if (role && role !== updatedUser.role) {
      const withRole = await updateUserRole(id, role);
      if (withRole) {
        finalUser = withRole;
      }
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: mapUserResponse(finalUser)
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }
    throw error;
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = readParam(req.params.id);

  if (id === req.user?.userId) {
    res.status(400).json({ message: 'Cannot delete yourself' });
    return;
  }

  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  // Delete associated authors first
  try {
    await AuthorModel.deleteMany({ userId: new ObjectId(id) });
  } catch (err) {
    console.error('Failed to delete associated authors', err);
  }

  const deleted = await deleteUserById(id);
  if (!deleted) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({ message: 'User deleted successfully' });
};
