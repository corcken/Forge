import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer Gesundheitscheck und Vault-Pfadinformationen. */
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
});
