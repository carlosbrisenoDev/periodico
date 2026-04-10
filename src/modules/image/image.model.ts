import multer from 'multer';
import mongoose, { Schema, Types } from 'mongoose';
import path from 'node:path';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type ImageDoc = {
  _id: Types.ObjectId;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

const imageSchema = new Schema<ImageDoc>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  {
    collection: 'images',
    versionKey: false,
    timestamps: true
  }
);

export const ImageModel = mongoose.models.Image || mongoose.model<ImageDoc>('Image', imageSchema);
const imagesCollection = () => createCollectionAdapter<ImageDoc>(ImageModel);

export { imagesCollection };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve('uploads/featured')),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension.toLowerCase()}`);
  }
});

export const uploadFeaturedImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedMimeTypes.includes(file.mimetype));
  }
});
