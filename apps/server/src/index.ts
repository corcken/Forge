import { createServer } from './server.js';
import { initializeServices } from './services.js';

export type { AppRouter } from './trpc/routers/app-router.js';

const PORT = Number(process.env.PORT ?? 4317);
const HOST = process.env.HOST ?? '127.0.0.1';

async function main(): Promise<void> {
  const services = initializeServices();
  const app = createServer(services);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Empfange ${signal} - fahre Server herunter...`);
    try {
      await app.close();
    } finally {
      services.shutdown();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: PORT, host: HOST });
    const active = services.runManager.getActiveRun();
    app.log.info(
      `Vault bereit: ${services.paths.root} | Aktiver Run: ${active ? active.name : 'keiner'}`,
    );
  } catch (error) {
    app.log.error(error);
    services.shutdown();
    process.exit(1);
  }
}

void main();
