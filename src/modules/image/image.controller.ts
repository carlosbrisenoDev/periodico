import { Request, Response } from 'express';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import { imagesCollection } from './image.model.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'Image file is required' });
    return;
  }

  const url = `/uploads/featured/${req.file.filename}`;
  const result = await imagesCollection().insertOne({
    _id: new ObjectId(),
    filename: req.file.filename,
    url,
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date()
  });

  res.status(201).json({
    id: result.insertedId.toString(),
    filename: req.file.filename,
    url
  });
};

export const listRecentImages = async (req: Request, res: Response): Promise<void> => {
  const limit = Number(req.query.limit ?? 20);
  const images = await imagesCollection().find({}).sort({ createdAt: -1 }).limit(limit).toArray();

  res.status(200).json(
    images.map((image) => ({
      id: image._id.toString(),
      filename: image.filename,
      url: image.url,
      mimeType: image.mimeType,
      size: image.size,
      createdAt: image.createdAt
    }))
  );
};

export const deleteImage = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
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
