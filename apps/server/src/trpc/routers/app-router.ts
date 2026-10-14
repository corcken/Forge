import { router } from '../trpc.js';
import { aiRouter } from './ai.router.js';
import { archetypesRouter } from './archetypes.router.js';
import { compilerRouter } from './compiler.router.js';
import { credentialsRouter } from './credentials.router.js';
import { partsRouter } from './parts.router.js';
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
});

export type AppRouter = typeof appRouter;
