import mongoose, { Schema, Types } from 'mongoose';

export type SubscriberRole = 'admin' | 'subscriber';
export type SubscriberStatus = 'active' | 'suspended' | 'deleted' | 'pending';

export type SubscriberDoc = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: SubscriberRole;
  status: SubscriberStatus;
  active: boolean;
  age?: number;
  phone?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubscriberInput = {
  username: string;
  email: string;
  passwordHash: string;
  role?: SubscriberRole;
  status?: SubscriberStatus;
  active?: boolean;
  age?: number;
  phone?: string;
  location?: string;
};

export type UpdateOwnSubscriberInput = {
  username?: string;
  email?: string;
  age?: number;
  phone?: string;
  location?: string;
};

const subscriberSchema = new Schema<SubscriberDoc>(
  {
    username: { type: String, required: true, trim: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'subscriber'], default: 'subscriber' },
    status: { type: String, enum: ['active', 'suspended', 'deleted', 'pending'], default: 'active' },
    active: { type: Boolean, default: true },
    age: { type: Number, required: false },
    phone: { type: String, required: false, trim: true },
    location: { type: String, required: false, trim: true }
  },
  {
    collection: 'subscribers',
    versionKey: false,
    timestamps: true
  }
);

export const SubscriberModel = mongoose.models.Subscriber || mongoose.model<SubscriberDoc>('Subscriber', subscriberSchema);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const createSubscriber = async (input: CreateSubscriberInput): Promise<SubscriberDoc> => {
  const subscriber = await SubscriberModel.create({
    username: input.username.trim(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    role: input.role ?? 'subscriber',
    status: input.status ?? 'active',
    active: input.active ?? true,
    age: input.age,
    phone: input.phone?.trim(),
    location: input.location?.trim()
  });

  return subscriber.toObject() as SubscriberDoc;
};

export const findSubscriberByEmail = async (email: string): Promise<SubscriberDoc | null> =>
  SubscriberModel.findOne({ email: normalizeEmail(email) }).exec();

export const findSubscriberById = async (id: string): Promise<SubscriberDoc | null> =>
  SubscriberModel.findById(id).exec();

export const listSubscribers = async (): Promise<SubscriberDoc[]> =>
  SubscriberModel.find({}).sort({ createdAt: -1 }).select('-passwordHash').lean<SubscriberDoc[]>().exec();

export const updateSubscriberPassword = async (id: string, passwordHash: string): Promise<SubscriberDoc | null> =>
  SubscriberModel.findByIdAndUpdate(
    id,
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    },
    { new: true }
  ).exec();

export const updateSubscriberRole = async (id: string, role: SubscriberRole): Promise<SubscriberDoc | null> =>
  SubscriberModel.findByIdAndUpdate(
    id,
    {
      $set: {
        role,
        updatedAt: new Date()
      }
    },
    { new: true }
  ).exec();

export const updateSubscriberActive = async (id: string, active: boolean): Promise<SubscriberDoc | null> =>
  SubscriberModel.findByIdAndUpdate(
    id,
    {
      $set: {
        active,
        status: active ? 'active' : 'suspended',
        updatedAt: new Date()
      }
    },
    { new: true }
  ).exec();

export const updateOwnSubscriber = async (id: string, input: UpdateOwnSubscriberInput): Promise<SubscriberDoc | null> => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const updates: {
    updatedAt: Date;
    username?: string;
    email?: string;
    age?: number;
    phone?: string;
    location?: string;
  } = {
    updatedAt: new Date()
  };

  if (input.username !== undefined) {
    updates.username = input.username.trim();
  }

  if (input.email !== undefined) {
    updates.email = normalizeEmail(input.email);
  }

  if (input.age !== undefined) {
    updates.age = input.age;
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone.trim();
  }

  if (input.location !== undefined) {
    updates.location = input.location.trim();
  }

  return (await SubscriberModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    {
      $set: updates
    },
    { new: true, lean: true }
  ).exec()) as SubscriberDoc | null;
};
