import { z } from 'zod';
import { SymbolFilterSchema } from '@descriptio-forge/shared';
import { exportRun, exportSymbols, listExports } from '../../exporter/exporter.js';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer den Descriptio-Paket-Export. */
export const exportRouter = router({
  run: publicProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      exportRun(input.runId, ctx.services.runParts, ctx.services.paths, ctx.services.categoryRepo),
    ),

  exportSymbols: publicProcedure
    .input(SymbolFilterSchema.optional())
    .mutation(({ ctx, input }) =>
      exportSymbols(ctx.services.symbolRepo, ctx.services.paths, input),
    ),

  list: publicProcedure.query(({ ctx }) => listExports(ctx.services.paths)),
});
