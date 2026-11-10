import { RawSourceTypeSchema } from '@descriptio-forge/shared';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer die Rohdaten-Ingestion (Datei-Ordner, HTML, URLs). */
export const ingestRouter = router({
  list: publicProcedure.query(({ ctx }) => ctx.services.rawRepo.list()),

  ingestUrl: publicProcedure
    .input(
      z.object({
        manufacturer: z.string().min(1),
        articleNr: z.string().min(1),
        url: z.string().url(),
        sourceType: RawSourceTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.services.rawIngestor.ingestUrl(
        { manufacturer: input.manufacturer, articleNr: input.articleNr, sourceType: input.sourceType },
        input.url,
      );
      const activeRun = ctx.services.runManager.getActiveRun();
      if (activeRun && !activeRun.isLocked) {
        const id = `${input.manufacturer}:${input.articleNr}`;
        ctx.services.runParts.upsertPart(activeRun.id, {
          id,
          manufacturer: input.manufacturer,
          articleNr: input.articleNr,
          pipelineStatus: 'INGESTED',
        });
        const totals = ctx.services.runParts.countParts(activeRun.id);
        ctx.services.runManager.updateCounters(activeRun.id, totals.total, totals.validated);
      }
      return res;
    }),

  ingestDirectory: publicProcedure
    .input(z.object({ dir: z.string().min(1), sourceType: RawSourceTypeSchema }))
    .mutation(({ ctx, input }) => {
      const result = ctx.services.rawIngestor.ingestDirectory(input.dir, input.sourceType);
      return { ingested: result.ingested };
    }),

  ingestEdzDirectory: publicProcedure
    .input(
      z.object({
        dir: z.string().min(1),
        runId: z.string().min(1).optional(),
        createRunName: z.string().min(1).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      let targetRunId = input.runId ?? null;
      if (input.createRunName) {
        const created = ctx.services.runManager.createRun(input.createRunName);
        ctx.services.runManager.switchActiveRun(created.id);
        targetRunId = created.id;
      }
      return ctx.services.edzIngestor.ingestEdzDirectory(input.dir, targetRunId);
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.services.rawRepo.remove(input.id);
      return { ok: true } as const;
    }),

  clearAll: publicProcedure.mutation(({ ctx }) => {
    const deleted = ctx.services.rawRepo.clearAll();
    return { deleted };
  }),
});
