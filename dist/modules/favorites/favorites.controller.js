import { Types } from 'mongoose';
import { ArticleModel } from '../article/article.model.js';
import { FavoriteModel } from './favorites.model.js';
const getSubscriberId = (req) => req.subscriber?.subscriberId ?? null;
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
export const addFavorite = async (req, res) => {
    const subscriberId = getSubscriberId(req);
    if (!subscriberId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { articleId } = req.body;
    const articleExists = await ArticleModel.exists({ _id: new Types.ObjectId(articleId) });
    if (!articleExists) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const existingFavorite = await FavoriteModel.findOne({
        subscriberId: new Types.ObjectId(subscriberId),
        articleId: new Types.ObjectId(articleId)
    })
        .select('_id')
        .lean()
        .exec();
    if (existingFavorite) {
        res.status(409).json({ message: 'Article already in favorites' });
        return;
    }
    const favorite = await FavoriteModel.create({
        subscriberId: new Types.ObjectId(subscriberId),
        articleId: new Types.ObjectId(articleId)
    });
    res.status(201).json({
        message: 'Favorite created',
        favorite: {
            id: favorite._id.toString(),
            articleId: favorite.articleId.toString(),
            subscriberId: favorite.subscriberId.toString()
        }
    });
};
export const removeFavorite = async (req, res) => {
    const subscriberId = getSubscriberId(req);
    if (!subscriberId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const articleId = readParam(req.params.articleId);
    const deleted = await FavoriteModel.findOneAndDelete({
        subscriberId: new Types.ObjectId(subscriberId),
        articleId: new Types.ObjectId(articleId)
    })
        .lean()
        .exec();
    if (!deleted) {
        res.status(404).json({ message: 'Favorite not found' });
        return;
    }
    res.status(200).json({ message: 'Favorite removed' });
};
export const listFavorites = async (req, res) => {
    const subscriberId = getSubscriberId(req);
    if (!subscriberId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const favorites = await FavoriteModel.find({
        subscriberId: new Types.ObjectId(subscriberId)
    })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    res.status(200).json({
        favorites: favorites.map((favorite) => ({
            id: favorite._id.toString(),
            articleId: favorite.articleId.toString(),
            createdAt: favorite.createdAt
        }))
    });
};
export const isFavorite = async (req, res) => {
    const subscriberId = getSubscriberId(req);
    if (!subscriberId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const articleId = readParam(req.params.articleId);
    const favorite = await FavoriteModel.exists({
        subscriberId: new Types.ObjectId(subscriberId),
        articleId: new Types.ObjectId(articleId)
    });
    res.status(200).json({ isFavorite: Boolean(favorite) });
};
