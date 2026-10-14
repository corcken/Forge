import { z } from 'zod';
import { buildRunTree } from '../../pipeline/run-tree.js';
import { publicProcedure, router } from '../trpc.js';

const runIdInput = z.object({ runId: z.string().min(1) });

/** tRPC-Routen fuer den deterministischen Regel-Compiler. */
export const compilerRouter = router({
  /** Kompiliert genau einen Artikel und speichert das Ergebnis im Run. */
  compilePart: publicProcedure
    .input(runIdInput.extend({ partId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.services.compileService.compilePart(input.runId, input.partId),
    ),

  /** Kompiliert alle oder die ausgewaehlten Artikel eines Runs. */
  compileParts: publicProcedure
    .input(runIdInput.extend({ partIds: z.array(z.string().min(1)).optional() }))
    .mutation(({ ctx, input }) =>
      ctx.services.compileService.compileParts(input.runId, input.partIds),
    ),

  /** Liefert das flach kompilierte Ergebnis eines Artikels zur Inspektion. */
  getCompiled: publicProcedure
    .input(runIdInput.extend({ partId: z.string().min(1) }))
    .query(({ ctx, input }) => {
      const part = ctx.services.runParts.getPart(input.runId, input.partId);
      if (!part) return null;
      return {
        status: part.pipelineStatus,
        qualityTier: part.qualityTier,
        completenessPct: part.completenessPct,
        validationErrors: part.validationErrors,
        fieldOrigins: part.fieldOrigins,
        compiledPart: part.compiledPart,
      };
    }),

  /** Kompakte Artikel-Uebersicht fuer das 24px-Grid. */
  listParts: publicProcedure.input(runIdInput).query(({ ctx, input }) =>
    ctx.services.runParts.listParts(input.runId).map((part) => ({
      id: part.id,
      manufacturer: part.manufacturer,
      articleNr: part.articleNr,
      archetypeId: part.archetypeId,
      status: part.pipelineStatus,
      qualityTier: part.qualityTier,
      completenessPct: part.completenessPct,
    })),
  ),

  /** Vollstaendiger Serie -> Artikel -> Funktionsgruppe -> Pin-Baum. */
  tree: publicProcedure.input(runIdInput).query(({ ctx, input }) =>
    buildRunTree(input.runId, ctx.services.runParts, ctx.services.runSeries),
  ),
});
