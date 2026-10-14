import { z } from 'zod';
import { parseArticleList } from '../../pipeline/import-parser.js';
import { publicProcedure, router } from '../trpc.js';

const runIdInput = z.object({ runId: z.string().min(1) });
const partIdInput = runIdInput.extend({ partId: z.string().min(1) });

/** tRPC-Routen fuer Artikel eines Runs (Import, Extraktion, Overrides). */
export const partsRouter = router({
  list: publicProcedure.input(runIdInput).query(({ ctx, input }) =>
    ctx.services.runParts.listParts(input.runId).map((part) => ({
      id: part.id,
      manufacturer: part.manufacturer,
      articleNr: part.articleNr,
      seriesId: part.seriesId,
      archetypeId: part.archetypeId,
      status: part.pipelineStatus,
      qualityTier: part.qualityTier,
      completenessPct: part.completenessPct,
      hasAiFacts: part.aiRawJson !== null,
      hasCompiled: part.compiledPart !== null,
      manualOverrideCount: Object.keys(part.manualOverrides).length,
      aiCostUsd: part.aiCostUsd,
    })),
  ),

  detail: publicProcedure
    .input(partIdInput)
    .query(({ ctx, input }) => ctx.services.runParts.getPart(input.runId, input.partId)),

  rawEvidence: publicProcedure.input(partIdInput).query(({ ctx, input }) => {
    const part = ctx.services.runParts.getPart(input.runId, input.partId);
    if (!part) return null;
    return ctx.services.globalDb.findRawDocument(part.manufacturer, part.articleNr);
  }),

  importList: publicProcedure
    .input(
      runIdInput.extend({
        text: z.string(),
        defaultArchetypeId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      const entries = parseArticleList(input.text);
      for (const entry of entries) {
        ctx.services.runParts.upsertPart(input.runId, {
          id: entry.id,
          manufacturer: entry.manufacturer,
          articleNr: entry.articleNr,
          archetypeId: input.defaultArchetypeId ?? null,
          pipelineStatus: 'PENDING_INGEST',
        });
      }
      return { imported: entries.length, entries };
    }),

  extractFacts: publicProcedure
    .input(
      runIdInput.extend({
        partIds: z.array(z.string().min(1)).min(1),
        providerId: z.string().min(1),
        modelId: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.services.extractionService.extractParts(
        input.runId,
        input.partIds,
        input.providerId,
        input.modelId,
      ),
    ),

  setOverride: publicProcedure
    .input(partIdInput.extend({ field: z.string().min(1), value: z.unknown() }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      ctx.services.runParts.setManualOverride(input.runId, input.partId, input.field, input.value);
      return { ok: true } as const;
    }),

  clearOverride: publicProcedure
    .input(partIdInput.extend({ field: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      ctx.services.runParts.clearManualOverride(input.runId, input.partId, input.field);
      return { ok: true } as const;
    }),

  remove: publicProcedure.input(partIdInput).mutation(({ ctx, input }) => {
    ctx.services.runManager.assertWritable(input.runId);
    ctx.services.runParts.deletePart(input.runId, input.partId);
    return { ok: true } as const;
  }),
});
