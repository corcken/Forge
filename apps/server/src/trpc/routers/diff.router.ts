import { z } from 'zod';
import { diffRuns } from '../../pipeline/run-differ.js';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer das Run-Diffing (Feld-fuer-Feld-Vergleich zweier Runs). */
export const diffRouter = router({
  compare: publicProcedure
    .input(z.object({ runIdA: z.string().min(1), runIdB: z.string().min(1) }))
    .query(({ ctx, input }) =>
      diffRuns(
        input.runIdA,
        input.runIdB,
        ctx.services.runParts.listParts(input.runIdA),
        ctx.services.runParts.listParts(input.runIdB),
      ),
    ),
});
