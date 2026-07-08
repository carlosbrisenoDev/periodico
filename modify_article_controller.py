import re

with open('src/modules/article/article.controller.ts', 'r') as f:
    content = f.read()

# 1. Update resolveFeaturedType signature
content = content.replace(
    "article: Pick<ArticleDoc, 'isFeatured'> & { featuredType?: string | null }",
    "article: Pick<ArticleDoc, 'isFeatured'> & { featuredTypes?: string[] }"
)

content = content.replace(
    "if (isFeaturedType(article.featuredType)) {\n        return article.featuredType as ArticleFeaturedType;\n    }",
    "if (article.featuredTypes && article.featuredTypes.length > 0) {\n        return article.featuredTypes[0] as ArticleFeaturedType;\n    }"
)

# Actually resolveFeaturedType is in public.controller.ts as well. Wait, this is article.controller.ts
content = content.replace(
    "export const resolveFeaturedAt = (\n    featuredType: ArticleFeaturedType,\n    existingFeaturedAt?: Date | null\n): Date | null => {\n    if (featuredType === 'none') {\n        return null;\n    }\n    return existingFeaturedAt ?? new Date();\n};",
    "export const resolveFeaturedAt = (\n    featuredTypes: ArticleFeaturedType[],\n    existingFeaturedAt?: Date | null\n): Date | null => {\n    if (featuredTypes.length === 0) {\n        return null;\n    }\n    return existingFeaturedAt ?? new Date();\n};"
)

# 2. enforceFeaturedLimits
enforce_new = """const enforceFeaturedLimits = async (articleId: ObjectId | undefined, featuredTypes: string[], categoryObjectIds: ObjectId[] = []): Promise<void> => {
    if (featuredTypes.length === 0) return;

    const demoteArticle = async (article: any, typeToRemove: string) => {
        const newTypes = (article.featuredTypes || []).filter((t: string) => t !== typeToRemove);
        const isFeatured = newTypes.length > 0;
        await articlesCollection().updateOne(
            { _id: article._id },
            { $set: { isFeatured, featuredTypes: newTypes, featuredAt: isFeatured ? article.featuredAt : null, updatedAt: new Date() } }
        );
    };

    if (featuredTypes.includes('hero')) {
        const heroArticles = await articlesCollection().find({ featuredTypes: 'hero' }).toArray();
        await Promise.all(
            heroArticles
                .filter((article) => !articleId || article._id.toString() !== articleId.toString())
                .map((article) => demoteArticle(article, 'hero'))
        );
    } 
    if (featuredTypes.includes('headline')) {
        const headlineArticles = await articlesCollection()
            .find({ featuredTypes: 'headline' })
            .sort({ featuredAt: -1 })
            .toArray();
        
        const others = headlineArticles.filter((article) => !articleId || article._id.toString() !== articleId.toString());
        if (others.length > 1) {
            const toDemote = others.slice(1);
            await Promise.all(
                toDemote.map((article) => demoteArticle(article, 'headline'))
            );
        }
    } 
    if (featuredTypes.includes('category_hero') && categoryObjectIds.length > 0) {
        const catHeroArticles = await articlesCollection()
            .find({ featuredTypes: 'category_hero', categoryIds: { $in: categoryObjectIds } })
            .toArray();
        await Promise.all(
            catHeroArticles
                .filter((article) => !articleId || article._id.toString() !== articleId.toString())
                .map((article) => demoteArticle(article, 'category_hero'))
        );
    } 
    if (featuredTypes.includes('breaking') && categoryObjectIds.length > 0) {
        for (const catId of categoryObjectIds) {
            const breakingArticles = await articlesCollection()
                .find({ featuredTypes: 'breaking', categoryIds: catId })
                .sort({ featuredAt: -1 })
                .toArray();
            
            const others = breakingArticles.filter((article) => !articleId || article._id.toString() !== articleId.toString());
            if (others.length > 1) {
                const toDemote = others.slice(1);
                await Promise.all(
                    toDemote.map((article) => demoteArticle(article, 'breaking'))
                );
            }
        }
    }
};"""

content = re.sub(r"const enforceFeaturedLimits = async .*?};\n", enforce_new + "\n", content, flags=re.DOTALL)

# Update toPublicArticle usage
content = content.replace("featuredType: resolveFeaturedType(article),", "featuredTypes: article.featuredTypes || [],")

# create article
content = content.replace("featuredType,", "featuredTypes,")
content = content.replace("isFeaturedType(featuredType)\n                ? featuredType\n                : 'none'", "Array.isArray(featuredTypes) ? featuredTypes.filter(isFeaturedType) : []")
content = content.replace("const normalizedFeaturedAt = resolveFeaturedAt(normalizedFeaturedType);", "const normalizedFeaturedAt = resolveFeaturedAt(normalizedFeaturedType as ArticleFeaturedType[]);")
content = content.replace("if (normalizedFeaturedType !== 'none') {\n            await enforceFeaturedLimits(undefined, normalizedFeaturedType, categoryObjectIds);\n        }", "if ((normalizedFeaturedType as ArticleFeaturedType[]).length > 0) {\n            await enforceFeaturedLimits(undefined, normalizedFeaturedType as ArticleFeaturedType[], categoryObjectIds);\n        }")
content = content.replace("isFeatured: normalizedFeaturedType !== 'none',", "isFeatured: (normalizedFeaturedType as ArticleFeaturedType[]).length > 0,")
content = content.replace("featuredType: normalizedFeaturedType as ArticleDoc['featuredType'],", "featuredTypes: normalizedFeaturedType as ArticleDoc['featuredTypes'],")


# update article
content = content.replace("typeof req.body.featuredType === 'string' && isFeaturedType(req.body.featuredType)\n            ? req.body.featuredType\n            : 'none'", "Array.isArray(req.body.featuredTypes) ? req.body.featuredTypes.filter(isFeaturedType) : []")
content = content.replace("const nextFeaturedType = req.body.featuredType !== undefined\n        ?", "const nextFeaturedType = req.body.featuredTypes !== undefined\n        ?")
content = content.replace("updates.featuredType = nextFeaturedType;", "updates.featuredTypes = nextFeaturedType;")
content = content.replace("if (nextFeaturedType !== 'none') {\n            const articleCategories = updates.categoryIds || articleFound.categoryIds || [];\n            await enforceFeaturedLimits(articleId, nextFeaturedType, articleCategories as ObjectId[]);\n        }", "if (nextFeaturedType && nextFeaturedType.length > 0) {\n            const articleCategories = updates.categoryIds || articleFound.categoryIds || [];\n            await enforceFeaturedLimits(articleId, nextFeaturedType, articleCategories as ObjectId[]);\n        }")

# feature toggle
content = content.replace("export const toggleFeature = async (req: Request, res: Response): Promise<void> => {", "export const toggleFeature = async (req: Request, res: Response): Promise<void> => {")
content = content.replace("if (typeof req.body.featuredType === 'string') {\n        nextFeaturedType = req.body.featuredType;\n    }", "if (Array.isArray(req.body.featuredTypes)) {\n        nextFeaturedType = req.body.featuredTypes.filter(isFeaturedType);\n    }")
content = content.replace("if (nextFeaturedType !== 'none') {\n        await enforceFeaturedLimits(articleId, nextFeaturedType, articleFound.categoryIds || []);\n    }", "if (nextFeaturedType && nextFeaturedType.length > 0) {\n        await enforceFeaturedLimits(articleId, nextFeaturedType, articleFound.categoryIds || []);\n    }")
content = content.replace("featuredType: nextFeaturedType,", "featuredTypes: nextFeaturedType,")
content = content.replace("featuredAt: nextFeaturedType === 'hero' ? new Date() : null,", "featuredAt: nextFeaturedType && nextFeaturedType.includes('hero') ? new Date() : null,")


# seed articles
content = content.replace("featuredType: 'none',", "featuredTypes: [],")


with open('src/modules/article/article.controller.ts', 'w') as f:
    f.write(content)

