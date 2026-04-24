import mongoose, {Schema, Types} from 'mongoose';
import {createCollectionAdapter} from '../../libs/mongoose-adapter.js';

export type ArticleStatus = 'draft' | 'published' | 'scheduled';
export type ArticleFeaturedType = 'none' | 'hero' | 'headline' | 'breaking';

export type ArticleDoc = {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImageUrl: string | null;
    tags: string[];
    status: ArticleStatus;
    isFeatured: boolean;
    featuredType: ArticleFeaturedType;
    featuredAt: Date | null;
    deletedAt: Date | null;
    authorId: Types.ObjectId;
    categoryIds: Types.ObjectId[];
    scheduledAt: Date | null;
    publishedAt: Date | null;
    views: number;
    createdAt: Date;
    updatedAt: Date;
};

const articleSchema = new Schema<ArticleDoc>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true
    },
    excerpt: {
        type: String,
        required: true,
        trim: true
    },
    content: {type: String,
        required: true
    },
    featuredImageUrl: {
        type: String,
        required: false,
        default: null
    },
    tags: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        required: true,
        enum: [
            'draft', 'published', 'scheduled'], default: 'draft', index: true},
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    featuredType: {
        type: String,
        enum: ['none', 'hero', 'headline', 'breaking'],
        default: 'none',
        index: true
    },
    featuredAt: {
        type: Date,
        required: false,
        default: null,
        index: true
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
        index: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Author',
        index: true
    },
    categoryIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],
    scheduledAt: {
        type: Date,
        required: false,
        default: null
    },
    publishedAt: {
        type: Date,
        required: false,
        default: null
    },
    views: {type: Number, default: 0, index: true}
}, {
    collection: 'articles', versionKey: false, timestamps: true
});

articleSchema.index({publishedAt: -1});

export const ArticleModel = mongoose.models.Article || mongoose.model<ArticleDoc>('Article', articleSchema);
const articlesCollection = () => createCollectionAdapter<ArticleDoc>(ArticleModel);

export {articlesCollection};
