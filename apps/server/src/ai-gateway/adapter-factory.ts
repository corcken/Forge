import type { AiProviderAdapterType } from '@descriptio-forge/shared';
import type { IAiProviderAdapter } from './adapter.interface.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { OpenAiCompatAdapter } from './openai-compat.adapter.js';

const gemini = new GeminiAdapter();
const openAiCompat = new OpenAiCompatAdapter();
const anthropic = new AnthropicAdapter();

/** Liefert die zum Adapter-Typ passende Adapter-Instanz. */
export function createAdapter(adapterType: AiProviderAdapterType): IAiProviderAdapter {
  switch (adapterType) {
    case 'GEMINI':
      return gemini;
    case 'ANTHROPIC':
      return anthropic;
    case 'OPENAI_COMPAT':
      return openAiCompat;
    default: {
      const exhaustive: never = adapterType;
      throw new Error(`Unbekannter Adapter-Typ: ${String(exhaustive)}`);
    }
  }
}
