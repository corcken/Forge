import { AiTaskTypeSchema } from '@descriptio-forge/shared';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

const providerIdInput = z.object({ providerId: z.string().min(1) });
const modelIdInput = z.object({ modelId: z.string().min(1) });

/** tRPC-Routen fuer Provider-Verwaltung, Modell-Sync und Kostenplanung. */
export const aiRouter = router({
  providers: router({
    list: publicProcedure.query(({ ctx }) => ctx.services.aiVault.listProviders()),

    test: publicProcedure
      .input(providerIdInput)
      .mutation(({ ctx, input }) => ctx.services.aiGateway.testProvider(input.providerId)),

    syncModels: publicProcedure
      .input(providerIdInput)
      .mutation(({ ctx, input }) => ctx.services.aiGateway.syncModels(input.providerId)),
  }),

  models: router({
    list: publicProcedure
      .input(z.object({ providerId: z.string().min(1).optional() }).optional())
      .query(({ ctx, input }) => ctx.services.aiVault.listModels(input?.providerId)),

    setActive: publicProcedure
      .input(modelIdInput.extend({ active: z.boolean() }))
      .mutation(({ ctx, input }) => {
        ctx.services.aiVault.setModelActive(input.modelId, input.active);
        return { ok: true } as const;
      }),

    setPricing: publicProcedure
      .input(
        modelIdInput.extend({
          inputPricePer1m: z.number().nonnegative().nullable(),
          outputPricePer1m: z.number().nonnegative().nullable(),
        }),
      )
      .mutation(({ ctx, input }) => {
        ctx.services.aiVault.updateModelPricing(
          input.modelId,
          input.inputPricePer1m,
          input.outputPricePer1m,
        );
        return { ok: true } as const;
      }),

    assignTasks: publicProcedure
      .input(modelIdInput.extend({ tasks: z.array(AiTaskTypeSchema) }))
      .mutation(({ ctx, input }) => {
        ctx.services.aiVault.assignTasks(input.modelId, input.tasks);
        return { ok: true } as const;
      }),
  }),

  cost: router({
    estimate: publicProcedure
      .input(
        z.object({
          modelId: z.string().min(1),
          itemCount: z.number().int().nonnegative(),
          avgInputTokens: z.number().int().nonnegative(),
          avgOutputTokens: z.number().int().nonnegative(),
        }),
      )
      .query(({ ctx, input }) =>
        ctx.services.aiGateway.estimateCost(
          input.modelId,
          input.itemCount,
          input.avgInputTokens,
          input.avgOutputTokens,
        ),
      ),
  }),
});
