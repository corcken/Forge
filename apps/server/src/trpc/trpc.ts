import { initTRPC } from '@trpc/server';
import type { Context } from './context.js';

/** Zentraler tRPC-Initialisierer mit typisiertem Vault-Kontext. */
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
