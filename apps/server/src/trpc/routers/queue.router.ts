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
    .mutation(({ ctx, input }) => {
      const candidates = input.partIds
        .map((id) => ctx.services.runParts.getPart(input.runId, id))
        .filter((part): part is NonNullable<typeof part> => Boolean(part))
        .filter((part) =>
          Boolean(
            ctx.services.globalDb.findRawDocument(part.manufacturer, part.articleNr)?.extractedMarkdown,
          ),
        );
      const unextracted = candidates.filter((part) => part.aiRawJson === null);
      const targetIds = (unextracted.length > 0 ? unextracted : candidates).map((part) => part.id);
      if (targetIds.length < input.partIds.length) {
        ctx.services.activityLog.info(
          'QUEUE',
          `KI-Queue-Filter: ${targetIds.length} von ${input.partIds.length} ausgewaehlten Artikeln werden extrahiert (bereits extrahierte oder ohne Datenblatt uebersprungen).`,
        );
      }
      return ctx.services.batchQueue.run(
        targetIds,
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
      );
    }),

  pause: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.pause()),
  resume: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.resume()),
  stop: publicProcedure.mutation(({ ctx }) => ctx.services.batchQueue.stop()),
});
