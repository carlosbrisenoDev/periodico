import { app } from './app.js';
import { env } from './config.js';
import { connectDatabase } from './db.js';
import { ensureDatabaseIndexes } from './libs/db-indexes.js';
import { ensureDefaultAdmin } from './modules/auth/auth.model.js';

const bootstrap = async ()=> {
  await connectDatabase();
  await ensureDatabaseIndexes();
  await ensureDefaultAdmin();

  app.listen(env.PORT, () => {
    process.stdout.write(`Server running on port ${env.PORT}\n`);
  });
};

bootstrap().catch((error) => {
  process.stderr.write(`Startup error: ${error.message}\n`);
  process.exit(1);
});
