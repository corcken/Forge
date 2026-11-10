import { z } from 'zod';
import {
  SymbolDefinitionSchema,
  SymbolFilterSchema,
} from '@descriptio-forge/shared';
import { router, publicProcedure } from '../trpc.js';

export const symbolsRouter = router({
  /** Liefert alle Symbole gemaess optionalen Filtern (Suche, BMK, IEC-Teil, Typ). */
  list: publicProcedure.input(SymbolFilterSchema.optional()).query(async ({ ctx, input }) => {
    return ctx.services.symbolRepo.listSymbols(input);
  }),

  /** Liest ein einzelnes Symbol anhand der ID. */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sym = ctx.services.symbolRepo.getSymbolById(input.id);
      if (!sym) throw new Error(`Symbol '${input.id}' nicht gefunden.`);
      return sym;
    }),

  /** Liefert aggregierte Kennzahlen zur Symbol-Bibliothek. */
  stats: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.symbolRepo.getStats();
  }),

  /** Speichert oder aktualisiert ein Symbol. */
  upsert: publicProcedure
    .input(SymbolDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      ctx.services.symbolRepo.upsertSymbol(input);
      return { ok: true, id: input.id };
    }),

  /** Loescht ein Symbol. */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = ctx.services.symbolRepo.deleteSymbol(input.id);
      return { ok: deleted };
    }),

  /** Startet die kapitelweise KI-Sammlung fuer fehlende IEC 60617 Nummern. */
  harvestCatalog: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        modelId: z.string(),
        partFilter: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.symbolHarvester.harvestCatalog(input);
    }),
});
