import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type PollOptionDoc = {
  id: string;
  text: string;
  imageUrl?: string;
  votes: number;
};

export type PollOtherResponseDoc = {
  text: string;
  createdAt: Date;
};

export type PollDoc = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  imageUrl?: string;
  allowMultiple: boolean;
  allowOther: boolean;
  active: boolean;
  order: number;
  options: PollOptionDoc[];
  otherVotes: number;
  otherResponses: PollOtherResponseDoc[];
  createdAt: Date;
  updatedAt: Date;
};

const pollOptionSchema = new Schema<PollOptionDoc>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: false, trim: true },
    votes: { type: Number, default: 0 }
  },
  { _id: false }
);

const pollOtherResponseSchema = new Schema<PollOtherResponseDoc>(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const pollSchema = new Schema<PollDoc>(
  {
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
  },
  {
    collection: 'polls',
    versionKey: false,
    timestamps: true
  }
);

export const PollModel = mongoose.models.Poll || mongoose.model<PollDoc>('Poll', pollSchema);
const pollsCollection = () => createCollectionAdapter<PollDoc>(PollModel);

export { pollsCollection };
