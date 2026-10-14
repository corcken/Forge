import { router } from '../trpc.js';
import { aiRouter } from './ai.router.js';
import { archetypesRouter } from './archetypes.router.js';
import { compilerRouter } from './compiler.router.js';
import { credentialsRouter } from './credentials.router.js';
import { diffRouter } from './diff.router.js';
import { exportRouter } from './export.router.js';
import { ingestRouter } from './ingest.router.js';
import { partsRouter } from './parts.router.js';
import { queueRouter } from './queue.router.js';
import { runsRouter } from './runs.router.js';
import { seriesRouter } from './series.router.js';
import { systemRouter } from './system.router.js';

/** Wurzel-Router, der alle fachlichen Sub-Router buendelt. */
export const appRouter = router({
  system: systemRouter,
  runs: runsRouter,
  credentials: credentialsRouter,
  ai: aiRouter,
  archetypes: archetypesRouter,
  series: seriesRouter,
  parts: partsRouter,
  compiler: compilerRouter,
  ingest: ingestRouter,
  queue: queueRouter,
  exporter: exportRouter,
  diff: diffRouter,
});

export type AppRouter = typeof appRouter;
