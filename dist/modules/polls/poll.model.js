import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const pollOptionSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: false, trim: true },
    votes: { type: Number, default: 0 }
}, { _id: false });
const pollOtherResponseSchema = new Schema({
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });
const pollSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    imageUrl: { type: String, required: false, trim: true },
    allowMultiple: { type: Boolean, default: false },
    allowOther: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    options: { type: [pollOptionSchema], default: [] },
    otherVotes: { type: Number, default: 0 },
    otherResponses: { type: [pollOtherResponseSchema], default: [] }
}, {
    collection: 'polls',
    versionKey: false,
    timestamps: true
});
export const PollModel = mongoose.models.Poll || mongoose.model('Poll', pollSchema);
const pollsCollection = () => createCollectionAdapter(PollModel);
export { pollsCollection };
