import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer Gesundheitscheck, Live-Terminal-Logs und Vault-Pfadinformationen. */
export const systemRouter = router({
  health: publicProcedure.query(() => ({
    ok: true as const,
    timestamp: new Date().toISOString(),
  })),

  vaultInfo: publicProcedure.query(({ ctx }) => {
    const { paths } = ctx.services;
    return {
      root: paths.root,
      credentialsFile: paths.credentialsFile,
      globalDbFile: paths.globalDbFile,
      rawCacheDir: paths.rawCacheDir,
      runsDir: paths.runsDir,
      exportsDir: paths.exportsDir,
    };
  }),

  archetypes: publicProcedure.query(({ ctx }) => ctx.services.globalDb.listArchetypes()),

  logs: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(1000).optional() }).optional())
    .query(({ ctx, input }) => ctx.services.activityLog.list(0, input?.limit ?? 300)),

  clearLogs: publicProcedure.mutation(({ ctx }) => {
    ctx.services.activityLog.clear();
    return { ok: true as const };
  }),
});
