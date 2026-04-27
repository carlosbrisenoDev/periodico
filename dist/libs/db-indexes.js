import { ArticleModel } from '../modules/article/article.model.js';
import { AuthorModel } from '../modules/author/author.model.js';
import { CategoryModel } from '../modules/category/category.model.js';
import { ImageModel } from '../modules/image/image.model.js';
import { SocialModel } from '../modules/social/social.model.js';
import { UserModel } from '../modules/auth/auth.model.js';
export const ensureDatabaseIndexes = async () => {
    await Promise.all([
        UserModel.syncIndexes(),
        CategoryModel.syncIndexes(),
        ArticleModel.syncIndexes(),
        AuthorModel.syncIndexes(),
        ImageModel.syncIndexes(),
        SocialModel.syncIndexes()
    ]);
};
