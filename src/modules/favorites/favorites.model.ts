import mongoose, {Schema, Types} from 'mongoose';

export type favoriteDoc = {
    _id: Types.ObjectId;
    articleId: Types.ObjectId;
    userId: Types.ObjectId;
};

const favorite = new Schema<favoriteDoc>({
    articleId: String,
    userId: String,

}, {
    collection: 'articles', versionKey: false, timestamps: true
});


export default mongoose.model("Favorite", favorite);
