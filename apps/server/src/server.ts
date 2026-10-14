import Fastify, { type FastifyInstance } from 'fastify';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { appRouter, type AppRouter } from './trpc/routers/app-router.js';
import { createContextFactory } from './trpc/context.js';
import type { AppServices } from './services.js';

/** Baut die Fastify-Instanz inkl. tRPC-Adapter und Health-Endpunkt. */
export function createServer(services: AppServices): FastifyInstance {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContextFactory(services),
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>);

  app.get('/health', async () => ({ ok: true, service: 'descriptio-forge-server' }));

  return app;
}
