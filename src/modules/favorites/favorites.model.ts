import mongoose, { Schema, Types } from 'mongoose';

export type FavoriteDoc = {
  _id: Types.ObjectId;
  subscriberId: Types.ObjectId;
  articleId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const favoriteSchema = new Schema<FavoriteDoc>(
  {
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
  },
  {
    collection: 'favorites',
    versionKey: false,
    timestamps: true
  }
);

favoriteSchema.index({ subscriberId: 1, articleId: 1 }, { unique: true });

export const FavoriteModel =
  mongoose.models.Favorite || mongoose.model<FavoriteDoc>('Favorite', favoriteSchema);
