import { z } from 'zod';
import { exportRun, listExports } from '../../exporter/exporter.js';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer den Descriptio-Paket-Export. */
export const exportRouter = router({
  run: publicProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(({ ctx, input }) => exportRun(input.runId, ctx.services.runParts, ctx.services.paths)),

  list: publicProcedure.query(({ ctx }) => listExports(ctx.services.paths)),
});
