import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const videoSchema = new Schema({
    url: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'twitter', 'other'], required: true },
    videoExternalId: { type: String, required: true },
    title: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'Author' }
}, {
    collection: 'videos',
    versionKey: false,
    timestamps: true
});
export const VideoModel = mongoose.models.Video || mongoose.model('Video', videoSchema);
export const videosCollection = () => createCollectionAdapter(VideoModel);
