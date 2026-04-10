import bcrypt from 'bcryptjs';
import mongoose, { Schema, Types } from 'mongoose';
import { env } from '../../config.js';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type UserRole = 'admin' | 'editor';

export type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'editor'], default: 'editor' },
    active: { type: Boolean, default: true }
  },
  {
    collection: 'users',
    versionKey: false,
    timestamps: true
  }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>('User', userSchema);
const getUsersCollection = () => createCollectionAdapter<UserDoc>(UserModel);

export const findUserByEmail = async (email: string): Promise<UserDoc | null> =>
  getUsersCollection().findOne({ email: email.toLowerCase() } as any);

export const findUserById = async (id: string): Promise<UserDoc | null> =>
  (await getUsersCollection().findOne({ _id: new Types.ObjectId(id) } as any)) ?? null;

export const createUser = async (input: CreateUserInput): Promise<UserDoc> => {
  const created = await UserModel.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    role: input.role,
    active: true
  });

  return created.toObject() as UserDoc;
};

export const updateUserPassword = async (id: string, passwordHash: string): Promise<boolean> => {
  if (!Types.ObjectId.isValid(id)) {
    return false;
  }

  const result = await UserModel.updateOne(
    { _id: new Types.ObjectId(id) },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  ).exec();

  return (result.matchedCount ?? 0) > 0;
};

export const listUsers = async (): Promise<UserDoc[]> =>
  (await UserModel.find({}).sort({ createdAt: -1 }).lean().exec()) as UserDoc[];

export const updateUserRole = async (id: string, role: UserRole): Promise<UserDoc | null> => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  return (await UserModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    {
      $set: {
        role,
        updatedAt: new Date()
      }
    },
    { new: true, lean: true }
  ).exec()) as UserDoc | null;
};

export const updateUserActive = async (id: string, active: boolean): Promise<UserDoc | null> => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  return (await UserModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    {
      $set: {
        active,
        updatedAt: new Date()
      }
    },
    { new: true, lean: true }
  ).exec()) as UserDoc | null;
};

export const ensureDefaultAdmin = async (): Promise<void> => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const email = env.ADMIN_EMAIL.toLowerCase();
  const userFound = await findUserByEmail(email);
  if (userFound) {
    return;
  }

  await UserModel.create({
    name: env.ADMIN_NAME,
    email,
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 10),
    role: 'admin',
    active: true
  });
};

export const usersCollection = getUsersCollection;
