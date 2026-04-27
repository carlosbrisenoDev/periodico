import mongoose, { Schema } from 'mongoose';
const favoriteSchema = new Schema({
    subscriberId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Subscriber',
        index: true
    },
    articleId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Article',
        index: true
    }
}, {
    collection: 'favorites',
    versionKey: false,
    timestamps: true
});
favoriteSchema.index({ subscriberId: 1, articleId: 1 }, { unique: true });
export const FavoriteModel = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
