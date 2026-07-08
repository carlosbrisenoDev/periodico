import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { imagesCollection } from './image.model.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
export const uploadImage = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'Image file is required' });
        return;
    }
    try {
        const originalPath = req.file.path;
        const parsedPath = path.parse(originalPath);
        let finalFilename;
        let finalMimeType;
        let finalSize;
        if (req.file.mimetype === 'application/pdf') {
            finalFilename = req.file.filename;
            finalMimeType = 'application/pdf';
            finalSize = req.file.size;
        }
        else {
            finalFilename = `${parsedPath.name}.webp`;
            const webpPath = path.join(parsedPath.dir, finalFilename);
            const sharpInfo = await sharp(originalPath)
                .resize({ width: 1200, withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(webpPath);
            finalMimeType = 'image/webp';
            finalSize = sharpInfo.size;
            await unlink(originalPath);
        }
        const url = `/uploads/featured/${finalFilename}`;
        const result = await imagesCollection().insertOne({
            _id: new ObjectId(),
            filename: finalFilename,
            url,
            mimeType: finalMimeType,
            size: finalSize,
            createdAt: new Date()
        });
        res.status(201).json({
            id: result.insertedId.toString(),
            filename: finalFilename,
            url
        });
    }
    catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ message: 'Error processing upload' });
    }
};
export const listRecentImages = async (req, res) => {
    const limit = Number(req.query.limit ?? 20);
    const images = await imagesCollection().find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    res.status(200).json(images.map((image) => ({
        id: image._id.toString(),
        filename: image.filename,
        url: image.url,
        mimeType: image.mimeType,
        size: image.size,
        createdAt: image.createdAt
    })));
};
export const deleteImage = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid image id' });
        return;
    }
    const image = await imagesCollection().findOneAndDelete({ _id: new ObjectId(id) });
    if (!image) {
        res.status(404).json({ message: 'Image not found' });
        return;
    }
    const targetPath = path.resolve('uploads/featured', image.filename);
    try {
        await unlink(targetPath);
        res.status(200).json({
            message: 'Image deleted',
            id,
            file: {
                status: 'deleted',
                path: `/uploads/featured/${image.filename}`
            }
        });
        return;
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            res.status(200).json({
                message: 'Image deleted from database; file was already missing',
                id,
                file: {
                    status: 'missing',
                    path: `/uploads/featured/${image.filename}`
                }
            });
            return;
        }
        res.status(200).json({
            message: 'Image deleted from database; file removal failed',
            id,
            file: {
                status: 'error',
                path: `/uploads/featured/${image.filename}`
            }
        });
    }
};
