import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@descriptio-forge/server';

/** Typsicherer tRPC-React-Hook-Client gegen den Descriptio-Forge-Server. */
export const trpc = createTRPCReact<AppRouter>();
