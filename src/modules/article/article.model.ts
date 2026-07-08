import mongoose, {Schema, Types} from 'mongoose';
import {createCollectionAdapter} from '../../libs/mongoose-adapter.js';

export type ArticleStatus = 'draft' | 'published' | 'scheduled';
export type ArticleFeaturedType = 'none' | 'hero' | 'headline' | 'category_hero' | 'breaking' | 'las_5_de_x';

export type ArticleDoc = {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImageUrl: string | null;
    featuredImageCaption: string | null;
    isVideoGallery: boolean;
    videoUrl: string | null;
    tags: string[];
    status: ArticleStatus;
    isFeatured: boolean;
    allowComments: boolean;
    featuredTypes: ArticleFeaturedType[];
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
    featuredImageCaption: {
        type: String,
        required: false,
        default: null
    },
    isVideoGallery: {
        type: Boolean,
        default: false
    },
    videoUrl: {
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
    allowComments: {
        type: Boolean,
        default: true
    },
    featuredTypes: {
        type: [String],
        enum: ['none', 'hero', 'headline', 'category_hero', 'breaking', 'las_5_de_x'],
        default: [],
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
