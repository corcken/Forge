import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

const runIdInput = z.object({ runId: z.string().min(1) });

/** tRPC-Routen fuer Erstellen, Klonen, Sperren und Aktivieren von Runs. */
export const runsRouter = router({
  list: publicProcedure.query(({ ctx }) => ctx.services.runManager.listRuns()),

  active: publicProcedure.query(({ ctx }) => ctx.services.runManager.getActiveRun()),

  get: publicProcedure
    .input(runIdInput)
    .query(({ ctx, input }) => ctx.services.runManager.getRun(input.runId)),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.services.runManager.createRun(input.name)),

  fork: publicProcedure
    .input(z.object({ sourceRunId: z.string().min(1), newName: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.services.runManager.forkRun(input.sourceRunId, input.newName),
    ),

  toggleLock: publicProcedure
    .input(runIdInput)
    .mutation(({ ctx, input }) => ctx.services.runManager.toggleLockRun(input.runId)),

  remove: publicProcedure.input(runIdInput).mutation(({ ctx, input }) => {
    ctx.services.runManager.deleteRun(input.runId);
    return { ok: true } as const;
  }),

  switchActive: publicProcedure
    .input(runIdInput)
    .mutation(({ ctx, input }) => ctx.services.runManager.switchActiveRun(input.runId)),
});
