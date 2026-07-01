import { app } from './app.js';
import { env } from './config.js';
import { connectDatabase } from './db.js';
import { ensureDatabaseIndexes } from './libs/db-indexes.js';
import { ensureDefaultAdmin } from './modules/auth/auth.model.js';
import { articlesCollection } from './modules/article/article.model.js';
//import { startNewsletterJob } from './modules/newsletter/newsletter.job.js';
import express from "express";
const FEATURED_SWEEP_INTERVAL_MS = 60 * 1000; // run every 1 minute
const sweepExpiredHeroArticles = async () => {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const heroArticles = await articlesCollection().find({ featuredType: 'hero' }).toArray();
        await Promise.all(heroArticles
            .filter((article) => {
            const startedAt = article.featuredAt ?? article.updatedAt ?? article.createdAt;
            return startedAt.getTime() <= cutoff.getTime();
        })
            .map((article) => articlesCollection().updateOne({ _id: article._id }, {
            $set: {
                isFeatured: false,
                featuredType: 'none',
                featuredAt: null,
                updatedAt: new Date(),
            },
        })));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Featured sweep error: ${message}\n`);
    }
};
const sweepScheduledArticles = async () => {
    try {
        const now = new Date();
        // Use aggregation pipeline to preserve the original scheduledAt as publishedAt
        const result = await articlesCollection().updateMany({ status: 'scheduled', scheduledAt: { $lte: now }, deletedAt: null }, [
            {
                $set: {
                    status: 'published',
                    publishedAt: { $ifNull: ['$scheduledAt', now] },
                    scheduledAt: null,
                    updatedAt: now,
                },
            },
        ]);
        if (result.modifiedCount > 0) {
            process.stdout.write(`[scheduler] Published ${result.modifiedCount} scheduled article(s)\n`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Scheduled sweep error: ${message}\n`);
    }
};
const bootstrap = async () => {
    await connectDatabase();
    await ensureDatabaseIndexes();
    await ensureDefaultAdmin();
    await sweepExpiredHeroArticles();
    await sweepScheduledArticles();
    setInterval(() => {
        void sweepExpiredHeroArticles();
        void sweepScheduledArticles();
    }, FEATURED_SWEEP_INTERVAL_MS);
    app.listen(env.PORT, () => {
        process.stdout.write(`Server running on port ${env.PORT}\n`);
    });
    app.use('/uploads', express.static('uploads'));
    // startNewsletterJob();
};
import fs from 'node:fs';
bootstrap().catch((error) => {
    const errorMsg = `Startup error: ${error instanceof Error ? error.stack : error}\n`;
    process.stderr.write(errorMsg);
    try {
        fs.writeFileSync('startup_error.log', errorMsg);
    }
    catch (e) { }
    process.exit(1);
});
