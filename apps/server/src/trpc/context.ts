import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AppServices } from '../services.js';

/** Pro Request erzeugter tRPC-Kontext. */
export interface Context {
  services: AppServices;
}

/**
 * Erzeugt eine createContext-Funktion, die die beim Serverstart initialisierten
 * Dienste (Vault + KI-Gateway) an alle Routen durchreicht.
 */
export function createContextFactory(services: AppServices) {
  return (_opts: CreateFastifyContextOptions): Context => ({ services });
}
