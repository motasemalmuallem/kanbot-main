import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './db/store.js';

await db.initialize();

const server = createApp().listen(env.PORT, '0.0.0.0', () => {
  console.log(`Kanbot API listening on port ${env.PORT}`);
  console.log(`  CORS origin(s): ${env.clientOrigins.join(', ')}`);
  console.log(`  Storage:        ${env.DATABASE_URL ? 'PostgreSQL' : env.DATA_FILE}`);
  console.log(`  AI assistant:   ${env.aiEnabled ? `${env.AI_MODEL} via ${env.AI_BASE_URL}` : 'mock (set AI_API_KEY in .env for a real model)'}`);
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  await new Promise<void>((resolve) => server.close(() => resolve()));
  try {
    await db.flush();
  } catch {
    console.error('Kanbot could not save pending changes before shutdown.');
    process.exitCode = 1;
  }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
