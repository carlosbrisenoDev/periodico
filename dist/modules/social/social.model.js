import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const socialSchema = new Schema({
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'Author', index: true },
    platform: { type: String, required: true, enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'custom'], index: true },
    url: { type: String, required: true, trim: true },
    label: { type: String, required: false, trim: true }
}, {
    collection: 'socials',
    versionKey: false,
    timestamps: true
});
socialSchema.index({ authorId: 1, platform: 1, url: 1 }, { unique: true });
socialSchema.index({ authorId: 1, createdAt: -1 });
export const SocialModel = mongoose.models.Social || mongoose.model('Social', socialSchema);
const socialsCollection = () => createCollectionAdapter(SocialModel);
export { socialsCollection };
