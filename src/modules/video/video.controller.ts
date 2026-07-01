import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { videosCollection } from './video.model.js';
import { logAudit } from '../audit/audit.controller.js';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

export const addVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { url, title } = req.body;
    
    if (!url) {
      res.status(400).json({ message: 'URL is required' });
      return;
    }

    let platform: 'youtube' | 'twitter' | 'other' = 'other';
    let videoExternalId = '';

    // Simple Youtube extraction
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoExternalId = match[2];
      }
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      platform = 'twitter';
      const regExp = /\/(status|statuses)\/(\d+)/;
      const match = url.match(regExp);
      if (match && match[2]) {
        videoExternalId = match[2];
      }
    }

    if (platform !== 'other' && !videoExternalId) {
       res.status(400).json({ message: 'Could not extract valid video ID from URL.' });
       return;
    }

    const result = await videosCollection().insertOne({
      _id: new ObjectId(),
      url,
      platform,
      videoExternalId: videoExternalId || url,
      title: title || '',
      addedBy: req.user ? new ObjectId(req.user.userId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (req.user) {
      await logAudit('create', 'Video', result.insertedId.toString(), req.user.userId, JSON.stringify({ url, platform, title }), {
        userName: req.user.email,
        userEmail: req.user.email
      });
    }

    res.status(201).json({
      id: result.insertedId.toString(),
      url,
      platform,
      videoExternalId,
      title
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding video' });
  }
};

export const listVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit ?? 20);
    const skip = Number(req.query.skip ?? 0);
    
    const videos = await videosCollection().find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    
    res.status(200).json(
      videos.map((v) => ({
        id: v._id.toString(),
        url: v.url,
        platform: v.platform,
        videoExternalId: v.videoExternalId,
        title: v.title,
        createdAt: v.createdAt
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

export const deleteVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid video id' });
      return;
    }

    const video = await videosCollection().findOneAndDelete({ _id: new ObjectId(id) });
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    if (req.user) {
      await logAudit('delete', 'Video', id, req.user.userId, JSON.stringify({ url: video.url }), {
        userName: req.user.email,
        userEmail: req.user.email
      });
    }

    res.status(200).json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video' });
  }
};
