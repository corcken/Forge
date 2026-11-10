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
      let cached = 0;
      const toFetch: typeof entries = [];

      for (const entry of entries) {
        const existingRaw = ctx.services.globalDb.findRawDocument(
          entry.manufacturer,
          entry.articleNr,
        );
        const hasCache = Boolean(existingRaw?.extractedMarkdown);
        if (hasCache) cached += 1;
        else if (entry.url) toFetch.push(entry);

        ctx.services.runParts.upsertPart(input.runId, {
          id: entry.id,
          manufacturer: entry.manufacturer,
          articleNr: entry.articleNr,
          archetypeId: input.defaultArchetypeId ?? null,
          pipelineStatus: hasCache ? 'INGESTED' : 'PENDING_INGEST',
        });
      }

      const totals = ctx.services.runParts.countParts(input.runId);
      ctx.services.runManager.updateCounters(input.runId, totals.total, totals.validated);

      if (toFetch.length > 0) {
        const byId = new Map(toFetch.map((item) => [item.id, item]));
        let consecutiveBlocks = 0;
        void ctx.services.batchQueue.run(
          toFetch.map((item) => item.id),
          async (partId) => {
            const item = byId.get(partId);
            if (!item?.url) return {};
            const sourceType = /\.pdf(?:$|\?)/iu.test(item.url) ? 'PDF_DATASHEET' : 'HTML_ETIM';
            try {
              await ctx.services.rawIngestor.ingestUrl(
                { manufacturer: item.manufacturer, articleNr: item.articleNr, sourceType },
                item.url,
              );
              consecutiveBlocks = 0;
              ctx.services.runParts.upsertPart(input.runId, {
                id: item.id,
                manufacturer: item.manufacturer,
                articleNr: item.articleNr,
                archetypeId: input.defaultArchetypeId ?? null,
                pipelineStatus: 'INGESTED',
              });
              return {};
            } catch (error) {
              const msg = error instanceof Error ? error.message : String(error);
              const isRateLimit = /HTTP (?:403|429)\b|Timeout nach|fetch failed/iu.test(msg);
              if (isRateLimit) {
                consecutiveBlocks += 1;
                if (consecutiveBlocks >= 6) {
                  ctx.services.activityLog.error(
                    'QUEUE',
                    'Rate-Limit / IP-Sperre erkannt (HTTP 403/429) – Batch-Download automatisch gestoppt, um Sperre nicht zu verlaengern.',
                  );
                  ctx.services.batchQueue.stop();
                }
              } else {
                ctx.services.runParts.upsertPart(input.runId, {
                  id: item.id,
                  manufacturer: item.manufacturer,
                  articleNr: item.articleNr,
                  archetypeId: input.defaultArchetypeId ?? null,
                  pipelineStatus: 'ERROR',
                });
              }
              throw error;
            }
          },
        );
      }

      return { imported: entries.length, cached, queuedUrls: toFetch.length, entries };
    }),

  /** Zaehlt ausstehende Ingestion-Artikel in einem Run. */
  pendingCount: publicProcedure.input(runIdInput).query(({ ctx, input }) => ({
    pending: ctx.services.runParts.countByStatus(input.runId, 'PENDING_INGEST'),
  })),

  /** Startet den Download fuer alle im Run auf PENDING_INGEST wartenden Artikel. */
  resumePendingIngest: publicProcedure
    .input(runIdInput.extend({ defaultArchetypeId: z.string().nullable().optional() }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      const pending = ctx.services.runParts.listPendingIngest(input.runId);
      if (pending.length === 0) return { queued: 0 };

      const toFetch = pending.map((item) => {
        const url =
          item.manufacturer.toLowerCase() === 'eaton'
            ? `https://www.eaton.com/de/de-de/skuPage.${item.articleNr}.html`
            : null;
        return { ...item, url };
      }).filter((item): item is typeof item & { url: string } => Boolean(item.url));

      const byId = new Map(toFetch.map((item) => [item.id, item]));
      let consecutiveBlocks = 0;
      void ctx.services.batchQueue.run(
        toFetch.map((item) => item.id),
        async (partId) => {
          const item = byId.get(partId);
          if (!item?.url) return {};
          const sourceType = /\.pdf(?:$|\?)/iu.test(item.url) ? 'PDF_DATASHEET' : 'HTML_ETIM';
          try {
            await ctx.services.rawIngestor.ingestUrl(
              { manufacturer: item.manufacturer, articleNr: item.articleNr, sourceType },
              item.url,
            );
            consecutiveBlocks = 0;
            ctx.services.runParts.upsertPart(input.runId, {
              id: item.id,
              manufacturer: item.manufacturer,
              articleNr: item.articleNr,
              archetypeId: input.defaultArchetypeId ?? null,
              pipelineStatus: 'INGESTED',
            });
            return {};
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const isRateLimit = /HTTP (?:403|429)\b|Timeout nach|fetch failed/iu.test(msg);
            if (isRateLimit) {
              consecutiveBlocks += 1;
              if (consecutiveBlocks >= 6) {
                ctx.services.activityLog.error(
                  'QUEUE',
                  'Rate-Limit / IP-Sperre erkannt (HTTP 403/429) – Batch-Download automatisch gestoppt, um Sperre nicht zu verlaengern.',
                );
                ctx.services.batchQueue.stop();
              }
            } else {
              ctx.services.runParts.upsertPart(input.runId, {
                id: item.id,
                manufacturer: item.manufacturer,
                articleNr: item.articleNr,
                archetypeId: input.defaultArchetypeId ?? null,
                pipelineStatus: 'ERROR',
              });
            }
            throw error;
          }
        },
      );

      return { queued: toFetch.length };
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
    const totals = ctx.services.runParts.countParts(input.runId);
    ctx.services.runManager.updateCounters(input.runId, totals.total, totals.validated);
    return { ok: true } as const;
  }),

  removeMany: publicProcedure
    .input(runIdInput.extend({ partIds: z.array(z.string().min(1)).min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.services.runManager.assertWritable(input.runId);
      for (const partId of input.partIds) {
        ctx.services.runParts.deletePart(input.runId, partId);
      }
      const totals = ctx.services.runParts.countParts(input.runId);
      ctx.services.runManager.updateCounters(input.runId, totals.total, totals.validated);
      return { deleted: input.partIds.length };
    }),
});
