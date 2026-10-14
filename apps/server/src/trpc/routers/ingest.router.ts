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
    .mutation(({ ctx, input }) =>
      ctx.services.rawIngestor.ingestUrl(
        { manufacturer: input.manufacturer, articleNr: input.articleNr, sourceType: input.sourceType },
        input.url,
      ),
    ),

  ingestDirectory: publicProcedure
    .input(z.object({ dir: z.string().min(1), sourceType: RawSourceTypeSchema }))
    .mutation(({ ctx, input }) => {
      const result = ctx.services.rawIngestor.ingestDirectory(input.dir, input.sourceType);
      return { ingested: result.ingested };
    }),
});
