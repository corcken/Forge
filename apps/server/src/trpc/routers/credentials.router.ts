import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

/** tRPC-Routen fuer den Out-of-Repo KI-Key-Tresor (immer nur maskiert!). */
export const credentialsRouter = router({
  list: publicProcedure.query(({ ctx }) => ctx.services.credentials.getMaskedStatuses()),

  set: publicProcedure
    .input(
      z.object({
        providerId: z.string().min(1),
        apiKey: z.string().nullable().optional(),
        baseUrl: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      ctx.services.credentials.setProvider(input.providerId, {
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
      });
      return ctx.services.credentials.getMaskedStatus(input.providerId);
    }),

  remove: publicProcedure
    .input(z.object({ providerId: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.services.credentials.removeProviderKey(input.providerId);
      return ctx.services.credentials.getMaskedStatus(input.providerId);
    }),
});
