import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const articleSchema = new Schema({
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
    content: { type: String,
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
            'draft', 'published', 'scheduled'
        ], default: 'draft', index: true
    },
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    featuredType: {
        type: String,
        enum: ['none', 'hero', 'headline', 'category_hero', 'breaking'],
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
    views: { type: Number, default: 0, index: true }
}, {
    collection: 'articles', versionKey: false, timestamps: true
});
articleSchema.index({ publishedAt: -1 });
export const ArticleModel = mongoose.models.Article || mongoose.model('Article', articleSchema);
const articlesCollection = () => createCollectionAdapter(ArticleModel);
export { articlesCollection };
