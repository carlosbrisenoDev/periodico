import re

with open('src/modules/public/public.controller.ts', 'r') as f:
    content = f.read()

# 1. Update resolveFeaturedType
resolve_new = """const resolveFeaturedTypes = (article: { isFeatured: boolean; featuredTypes?: string[] | null }): string[] => {
  if (Array.isArray(article.featuredTypes)) {
    return article.featuredTypes.filter(t => ['hero', 'headline', 'breaking', 'category_hero', 'las_5_de_x'].includes(t));
  }

  return article.isFeatured ? ['hero'] : [];
};"""

content = re.sub(r"const resolveFeaturedType = .*?};\n", resolve_new + "\n", content, flags=re.DOTALL)

# 2. Update isActiveFeaturedArticle
is_active_new = """const isActiveFeaturedArticle = (article: {
  isFeatured: boolean;
  featuredTypes?: string[] | null;
  featuredAt?: Date | null;
  updatedAt: Date;
  createdAt: Date;
}): boolean => {
  const featuredTypes = resolveFeaturedTypes(article);

  if (featuredTypes.length === 0) {
    return false;
  }

  if (!featuredTypes.includes('hero')) {
    return true;
  }

  const startedAt = article.featuredAt ?? article.updatedAt ?? article.createdAt;
  return Date.now() - startedAt.getTime() < FEATURED_HERO_MAX_AGE_MS;
};"""

content = re.sub(r"const isActiveFeaturedArticle = .*?};\n", is_active_new + "\n", content, flags=re.DOTALL)

# 3. Update toPublicArticle
content = content.replace("featuredType?: string | null;", "featuredTypes?: string[] | null;")
content = content.replace("featuredType: activeFeatured ? resolveFeaturedType(article) : 'none',", "featuredTypes: activeFeatured ? resolveFeaturedTypes(article) : [],")

with open('src/modules/public/public.controller.ts', 'w') as f:
    f.write(content)

