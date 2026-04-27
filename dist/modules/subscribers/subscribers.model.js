import mongoose, { Schema, Types } from 'mongoose';
const subscriberSchema = new Schema({
    username: { type: String, required: true, trim: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'subscriber'], default: 'subscriber' },
    status: { type: String, enum: ['active', 'suspended', 'deleted', 'pending'], default: 'active' },
    active: { type: Boolean, default: true }
}, {
    collection: 'subscribers',
    versionKey: false,
    timestamps: true
});
export const SubscriberModel = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
const normalizeEmail = (email) => email.trim().toLowerCase();
export const createSubscriber = async (input) => {
    const subscriber = await SubscriberModel.create({
        username: input.username.trim(),
        email: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        role: input.role ?? 'subscriber',
        status: input.status ?? 'active',
        active: input.active ?? true
    });
    return subscriber.toObject();
};
export const findSubscriberByEmail = async (email) => SubscriberModel.findOne({ email: normalizeEmail(email) }).exec();
export const findSubscriberById = async (id) => SubscriberModel.findById(id).exec();
export const listSubscribers = async () => SubscriberModel.find({}).sort({ createdAt: -1 }).select('-passwordHash').lean().exec();
export const updateSubscriberPassword = async (id, passwordHash) => SubscriberModel.findByIdAndUpdate(id, {
    $set: {
        passwordHash,
        updatedAt: new Date()
    }
}, { new: true }).exec();
export const updateSubscriberRole = async (id, role) => SubscriberModel.findByIdAndUpdate(id, {
    $set: {
        role,
        updatedAt: new Date()
    }
}, { new: true }).exec();
export const updateSubscriberActive = async (id, active) => SubscriberModel.findByIdAndUpdate(id, {
    $set: {
        active,
        status: active ? 'active' : 'suspended',
        updatedAt: new Date()
    }
}, { new: true }).exec();
export const updateOwnSubscriber = async (id, input) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }
    const updates = {
        updatedAt: new Date()
    };
    if (input.username !== undefined) {
        updates.username = input.username.trim();
    }
    if (input.email !== undefined) {
        updates.email = normalizeEmail(input.email);
    }
    return (await SubscriberModel.findOneAndUpdate({ _id: new Types.ObjectId(id) }, {
        $set: updates
    }, { new: true, lean: true }).exec());
};
