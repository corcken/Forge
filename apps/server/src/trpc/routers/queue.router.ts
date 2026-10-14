import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer die pausierbare Batch-Queue (KI-Extraktion). */
export const queueRouter = router({
  status: publicProcedure.query(({ ctx }) => ctx.services.batchQueue.getState()),

  startExtraction: publicProcedure
    .input(
      z.object({
        runId: z.string().min(1),
        partIds: z.array(z.string().min(1)).min(1),
        providerId: z.string().min(1),
        modelId: z.string().min(1),
        budgetUsd: z.number().nonnegative().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.services.batchQueue.run(
        input.partIds,
        async (partId) => {
          const result = await ctx.services.extractionService.extractOne(
            input.runId,
            partId,
            input.providerId,
            input.modelId,
          );
          if (result.status === 'ERROR') throw new Error(result.error ?? 'Extraktion fehlgeschlagen.');
          return { costUsd: result.costUsd ?? 0 };
        },
        input.budgetUsd ?? null,
      ),
    ),

  pause: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.pause()),
  resume: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.resume()),
  stop: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.stop()),
});
