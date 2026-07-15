import { ObjectId } from 'mongodb';
import { videosCollection } from './video.model.js';
import { logAudit } from '../audit/index.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
export const addVideo = async (req, res) => {
    try {
        const { url } = req.body;
        let title = req.body.title || '';
        if (!url) {
            res.status(400).json({ message: 'URL is required' });
            return;
        }
        let platform = 'other';
        let videoExternalId = '';
        // Robust Youtube extraction including shorts and live
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i);
        // Robust Twitter/X extraction
        const twMatch = url.match(/(?:twitter\.com|x\.com)\/\w+\/status(?:es)?\/(\d+)/i);
        if (ytMatch && ytMatch[1]) {
            platform = 'youtube';
            videoExternalId = ytMatch[1];
        }
        else if (twMatch && twMatch[1]) {
            platform = 'twitter';
            videoExternalId = twMatch[1];
        }
        else {
            // If we cannot extract ID but it looks like a url, we just save it as other
            platform = 'other';
            videoExternalId = url;
        }
        // Attempt to fetch title from YouTube if missing
        if (!title && platform === 'youtube' && videoExternalId) {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoExternalId}&format=json`;
                const res = await fetch(oembedUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.title) {
                        title = data.title;
                    }
                }
            }
            catch (err) {
                // silently fallback if fetch fails
            }
        }
        const result = await videosCollection().insertOne({
            _id: new ObjectId(),
            url,
            platform,
            videoExternalId: videoExternalId || url,
            title,
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding video' });
    }
};
export const listVideos = async (req, res) => {
    try {
        const limit = Number(req.query.limit ?? 20);
        const skip = Number(req.query.skip ?? 0);
        const videos = await videosCollection().find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
        res.status(200).json(videos.map((v) => ({
            id: v._id.toString(),
            url: v.url,
            platform: v.platform,
            videoExternalId: v.videoExternalId,
            title: v.title,
            createdAt: v.createdAt
        })));
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching videos' });
    }
};
export const deleteVideo = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting video' });
    }
};
