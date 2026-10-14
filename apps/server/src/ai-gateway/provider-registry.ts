import type { AiProviderAdapterType } from '@descriptio-forge/shared';

/** Definition eines Standard-Providers fuer das initiale Seeding. */
export interface ProviderDefinition {
  id: string;
  displayName: string;
  baseUrl: string;
  adapterType: AiProviderAdapterType;
}

/** Die sechs unterstuetzten Standard-Provider gemaess MANIFEST Abschnitt 4.2. */
export const PROVIDER_DEFINITIONS: readonly ProviderDefinition[] = [
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    adapterType: 'GEMINI',
  },
  {
    id: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    adapterType: 'OPENAI_COMPAT',
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    adapterType: 'ANTHROPIC',
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    adapterType: 'OPENAI_COMPAT',
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    adapterType: 'OPENAI_COMPAT',
  },
  {
    id: 'ollama',
    displayName: 'Ollama (lokal)',
    baseUrl: 'http://localhost:11434',
    adapterType: 'OPENAI_COMPAT',
  },
];

export const getProviderDefinition = (id: string): ProviderDefinition | undefined =>
  PROVIDER_DEFINITIONS.find((provider) => provider.id === id);
