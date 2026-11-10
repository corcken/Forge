import { CategoryFilterSchema } from '@descriptio-forge/shared';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

export const categoriesRouter = router({
  /** Liefert alle Kategorien gemaess Filter, angereichert mit Artikel-Zaehlern des aktiven Runs. */
  list: publicProcedure.input(CategoryFilterSchema.optional()).query(({ ctx, input }) => {
    const categories = ctx.services.categoryRepo.listCategories(input);
    const activeRun = ctx.services.runManager.getActiveRun();

    let counts: Record<string, number> = {};
    if (activeRun) {
      try {
        const runDb = ctx.services.runManager.getRunDb(activeRun.id);
        counts = ctx.services.categoryRepo.countPartsByCategory(runDb);
      } catch {
        // Run-DB evtl. nicht geoeffnet
      }
    }

    return categories.map((cat) => ({
      ...cat,
      partCount: counts[cat.slug] ?? 0,
    }));
  }),

  /** Liefert eine einzelne Kategorie per Slug. */
  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ ctx, input }) => {
    return ctx.services.categoryRepo.getBySlug(input.slug);
  }),

  /** Klassifiziert alle validierten Artikel eines Runs deterministisch neu. */
  reclassify: publicProcedure
    .input(z.object({ runId: z.string().optional() }).optional())
    .mutation(({ ctx, input }) => {
      const activeRun = ctx.services.runManager.getActiveRun();
      const targetRunId = input?.runId ?? activeRun?.id;
      if (!targetRunId) {
        throw new Error('Kein Run ausgewaehlt und kein aktiver Run vorhanden.');
      }
      return ctx.services.categoryBatch.reclassifyRun(targetRunId);
    }),

  /** Klassifiziert alle registrierten Runs im System neu. */
  reclassifyAll: publicProcedure.mutation(({ ctx }) => {
    const runs = ctx.services.runManager.listRuns();
    const results = runs.map((r) => ctx.services.categoryBatch.reclassifyRun(r.id));
    return {
      totalRuns: runs.length,
      runs: results,
    };
  }),
});
