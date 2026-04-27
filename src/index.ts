import { app } from './app.js';
import { env } from './config.js';
import { connectDatabase } from './db.js';
import { ensureDatabaseIndexes } from './libs/db-indexes.js';
import { ensureDefaultAdmin } from './modules/auth/auth.model.js';
import { articlesCollection } from './modules/article/article.model.js';
//import { startNewsletterJob } from './modules/newsletter/newsletter.job.js';
import express from "express";

const FEATURED_SWEEP_INTERVAL_MS = 60 * 60 * 1000;

const sweepExpiredHeroArticles = async (): Promise<void> => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const heroArticles = await articlesCollection().find({ featuredType: 'hero' }).toArray();

    await Promise.all(
      heroArticles
        .filter((article) => {
          const startedAt = article.featuredAt ?? article.updatedAt ?? article.createdAt;
          return startedAt.getTime() <= cutoff.getTime();
        })
        .map((article) =>
          articlesCollection().updateOne(
            { _id: article._id },
            {
              $set: {
                isFeatured: false,
                featuredType: 'none',
                featuredAt: null,
                updatedAt: new Date(),
              },
            },
          ),
        ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Featured sweep error: ${message}\n`);
  }
};

const bootstrap = async () => {
  await connectDatabase();
  await ensureDatabaseIndexes();
  await ensureDefaultAdmin();
  await sweepExpiredHeroArticles();
  setInterval(() => {
    void sweepExpiredHeroArticles();
  }, FEATURED_SWEEP_INTERVAL_MS);

  app.listen(env.PORT, () => {
    process.stdout.write(`Server running on port ${env.PORT}\n`);
  });
  app.use('/uploads', express.static('uploads'));
  // startNewsletterJob();
};

bootstrap().catch((error) => {
  process.stderr.write(`Startup error: ${error.message}\n`);
  process.exit(1);
});
