import fs from 'node:fs';
import type { MaskedCredentialStatus } from './vault-types.js';

/** Bekannte Provider-IDs (fixe Grundordnung des KI-Tresors). */
export const KNOWN_PROVIDER_IDS = [
  'gemini',
  'openai',
  'anthropic',
  'deepseek',
  'openrouter',
  'ollama',
] as const;

export type KnownProviderId = (typeof KNOWN_PROVIDER_IDS)[number];

/** Sinnvolle Default-Basis-URLs je Provider (in credentials.json ueberschreibbar). */
export const DEFAULT_BASE_URLS: Record<KnownProviderId, string> = {
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com',
  anthropic: 'https://api.anthropic.com',
  deepseek: 'https://api.deepseek.com',
  openrouter: 'https://openrouter.ai/api',
  ollama: 'http://localhost:11434',
};

interface ProviderCredentialEntry {
  apiKey?: string | null;
  baseUrl?: string | null;
}

interface CredentialsFile {
  version: number;
  providers: Record<string, ProviderCredentialEntry>;
}

const CREDENTIALS_VERSION = 1;

/** Baut das leere credentials.json-Template mit allen bekannten Providern. */
function buildTemplate(): CredentialsFile {
  const providers: Record<string, ProviderCredentialEntry> = {};
  for (const id of KNOWN_PROVIDER_IDS) {
    providers[id] = { apiKey: null, baseUrl: DEFAULT_BASE_URLS[id] };
  }
  return { version: CREDENTIALS_VERSION, providers };
}

/** Maskiert einen Key zu `••••8f9a`. Gibt niemals den Klartext zurueck. */
export function maskApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null;
  const trimmed = apiKey.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

/**
 * Verwaltet `~/.descriptio-forge/credentials.json` (Out-of-Repo, chmod 600).
 * Nach aussen werden ausschliesslich maskierte Statusinformationen gegeben.
 */
export class CredentialsStore {
  constructor(private readonly filePath: string) {}

  /** Legt die Datei mit Template an, falls sie fehlt (chmod 600). */
  ensureFile(): void {
    if (fs.existsSync(this.filePath)) return;
    this.write(buildTemplate());
  }

  /** Liest die Credentials; fehlende/unlesbare Datei ergibt das Template. */
  read(): CredentialsFile {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<CredentialsFile>;
      return this.normalize(parsed);
    } catch {
      return buildTemplate();
    }
  }

  /** Schreibt die Credentials mit restriktiven Rechten (0600). */
  write(data: CredentialsFile): void {
    fs.writeFileSync(this.filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    try {
      fs.chmodSync(this.filePath, 0o600);
    } catch {
      // Windows kennt keine POSIX-Modi - bewusst ignorieren.
    }
  }

  /** Interner Zugriff auf den Klartext-Key (NUR fuer Backend-Requests). */
  getProviderKey(providerId: string): string | null {
    const entry = this.read().providers[providerId];
    const key = entry?.apiKey?.trim();
    return key && key.length > 0 ? key : null;
  }

  /** Vom Nutzer konfigurierte Basis-URL (credentials.json) oder null. */
  getProviderBaseUrl(providerId: string): string | null {
    const entry = this.read().providers[providerId];
    const url = entry?.baseUrl?.trim();
    return url && url.length > 0 ? url : null;
  }

  /** Setzt/aktualisiert Key und optionale baseUrl eines Providers. */
  setProvider(
    providerId: string,
    patch: { apiKey?: string | null; baseUrl?: string | null },
  ): void {
    const data = this.read();
    const existing = data.providers[providerId] ?? {};
    data.providers[providerId] = {
      apiKey: patch.apiKey !== undefined ? patch.apiKey : (existing.apiKey ?? null),
      baseUrl: patch.baseUrl !== undefined ? patch.baseUrl : (existing.baseUrl ?? null),
    };
    this.write(data);
  }

  /** Entfernt den Key eines Providers (baseUrl bleibt erhalten). */
  removeProviderKey(providerId: string): void {
    this.setProvider(providerId, { apiKey: null });
  }

  /** Maskierter Status eines Providers - sicher fuer das Frontend. */
  getMaskedStatus(providerId: string): MaskedCredentialStatus {
    const entry = this.read().providers[providerId];
    const key = entry?.apiKey?.trim();
    return {
      providerId,
      hasKey: Boolean(key && key.length > 0),
      maskedPreview: maskApiKey(key),
      baseUrl: entry?.baseUrl ?? DEFAULT_BASE_URLS[providerId as KnownProviderId] ?? null,
    };
  }

  /** Maskierte Status aller bekannten Provider. */
  getMaskedStatuses(): MaskedCredentialStatus[] {
    return KNOWN_PROVIDER_IDS.map((id) => this.getMaskedStatus(id));
  }

  private normalize(parsed: Partial<CredentialsFile>): CredentialsFile {
    const template = buildTemplate();
    const incoming = parsed.providers ?? {};
    const providers: Record<string, ProviderCredentialEntry> = { ...template.providers };
    for (const [id, entry] of Object.entries(incoming)) {
      providers[id] = {
        apiKey: entry?.apiKey ?? null,
        baseUrl: entry?.baseUrl ?? null,
      };
    }
    return { version: parsed.version ?? CREDENTIALS_VERSION, providers };
  }
}
