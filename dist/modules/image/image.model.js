import multer from 'multer';
import mongoose, { Schema } from 'mongoose';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const imageSchema = new Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
}, {
    collection: 'images',
    versionKey: false,
    timestamps: true
});
export const ImageModel = mongoose.models.Image || mongoose.model('Image', imageSchema);
const imagesCollection = () => createCollectionAdapter(ImageModel);
export { imagesCollection };
const uploadDirectory = path.resolve('uploads/featured');
mkdirSync(uploadDirectory, { recursive: true });
const MIME_EXTENSION_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png'
};
const sanitizeBaseName = (value) => {
    const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80);
    return normalized || 'imagen';
};
const padTwo = (value) => String(value).padStart(2, '0');
const buildTimestamp = (date) => {
    const day = padTwo(date.getDate());
    const month = padTwo(date.getMonth() + 1);
    const year = String(date.getFullYear());
    const hours = padTwo(date.getHours());
    const minutes = padTwo(date.getMinutes());
    const seconds = padTwo(date.getSeconds());
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${day}-${month}-${year}-${hours}-${minutes}-${seconds}-${milliseconds}`;
};
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
        const originalExtension = path.extname(file.originalname).toLowerCase();
        const extension = (MIME_EXTENSION_MAP[file.mimetype] ?? originalExtension) || '.jpg';
        const baseName = sanitizeBaseName(path.basename(file.originalname, path.extname(file.originalname)));
        const timestamp = buildTimestamp(new Date());
        cb(null, `${baseName}_${timestamp}${extension}`);
    }
});
export const uploadFeaturedImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        cb(null, allowedMimeTypes.includes(file.mimetype));
    }
});
