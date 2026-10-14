import { router } from '../trpc.js';
import { aiRouter } from './ai.router.js';
import { compilerRouter } from './compiler.router.js';
import { credentialsRouter } from './credentials.router.js';
import { runsRouter } from './runs.router.js';
import { systemRouter } from './system.router.js';

/** Wurzel-Router, der alle fachlichen Sub-Router buendelt. */
export const appRouter = router({
  system: systemRouter,
  runs: runsRouter,
  credentials: credentialsRouter,
  ai: aiRouter,
  compiler: compilerRouter,
});

export type AppRouter = typeof appRouter;
