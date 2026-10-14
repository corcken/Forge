import { SeriesOverrideSchema } from '@descriptio-forge/shared';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

const runIdInput = z.object({ runId: z.string().min(1) });

/** tRPC-Routen fuer die Baureihen-Vererbung (CatalogSeries) eines Runs. */
export const seriesRouter = router({
  list: publicProcedure
    .input(runIdInput)
    .query(({ ctx, input }) => ctx.services.runSeries.listSeries(input.runId)),

  upsert: publicProcedure
    .input(runIdInput.extend({ series: SeriesOverrideSchema }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      const series = { ...input.series, updatedAt: new Date().toISOString() };
      ctx.services.runSeries.upsertSeries(input.runId, series);
      return ctx.services.runSeries.getSeries(input.runId, series.id);
    }),

  remove: publicProcedure
    .input(runIdInput.extend({ seriesId: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      ctx.services.runSeries.deleteSeries(input.runId, input.seriesId);
      return { ok: true } as const;
    }),
});
