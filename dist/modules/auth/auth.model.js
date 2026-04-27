import bcrypt from 'bcryptjs';
import mongoose, { Schema, Types } from 'mongoose';
import { env } from '../../config.js';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'editor'], default: 'editor' },
    active: { type: Boolean, default: true }
}, {
    collection: 'users',
    versionKey: false,
    timestamps: true
});
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
const getUsersCollection = () => createCollectionAdapter(UserModel);
export const findUserByEmail = async (email) => getUsersCollection().findOne({ email: email.toLowerCase() });
export const findUserById = async (id) => (await getUsersCollection().findOne({ _id: new Types.ObjectId(id) })) ?? null;
export const createUser = async (input) => {
    const created = await UserModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        active: true
    });
    return created.toObject();
};
export const updateUserPassword = async (id, passwordHash) => {
    if (!Types.ObjectId.isValid(id)) {
        return false;
    }
    const result = await UserModel.updateOne({ _id: new Types.ObjectId(id) }, {
        $set: {
            passwordHash,
            updatedAt: new Date()
        }
    }).exec();
    return (result.matchedCount ?? 0) > 0;
};
export const listUsers = async () => (await UserModel.find({}).sort({ createdAt: -1 }).lean().exec());
export const updateUserRole = async (id, role) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    return (await UserModel.findOneAndUpdate({ _id: new Types.ObjectId(id) }, {
        $set: {
            role,
            updatedAt: new Date()
        }
    }, { new: true, lean: true }).exec());
};
export const updateUserActive = async (id, active) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    return (await UserModel.findOneAndUpdate({ _id: new Types.ObjectId(id) }, {
        $set: {
            active,
            updatedAt: new Date()
        }
    }, { new: true, lean: true }).exec());
};
export const updateOwnUser = async (id, input) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    const updates = {
        updatedAt: new Date()
    };
    if (input.name !== undefined) {
        updates.name = input.name.trim();
    }
    if (input.email !== undefined) {
        updates.email = input.email.toLowerCase();
    }
    return (await UserModel.findOneAndUpdate({ _id: new Types.ObjectId(id) }, {
        $set: updates
    }, { new: true, lean: true }).exec());
};
export const ensureDefaultAdmin = async () => {
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
