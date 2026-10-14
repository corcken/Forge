import { IecArchetypeSchema } from '@descriptio-forge/shared';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer die globalen IEC-Archetypen. */
export const archetypesRouter = router({
  list: publicProcedure.query(({ ctx }) => ctx.services.globalDb.listArchetypes()),

  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.services.globalDb.getArchetype(input.id)),

  upsert: publicProcedure
    .input(z.object({ archetype: IecArchetypeSchema }))
    .mutation(({ ctx, input }) => {
      ctx.services.globalDb.upsertArchetype(input.archetype);
      return ctx.services.globalDb.getArchetype(input.archetype.id);
    }),
});
