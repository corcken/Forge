/** Standard-Timeout fuer alle Provider-Requests (8.000 ms gemaess Ablauf 2). */
export const DEFAULT_TIMEOUT_MS = 8000;

/** Traegt HTTP-Status und Antwortkoerper zu Diagnosezwecken. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Verbindet Basis-URL und Pfad robust (ignoriert ueberzaehlige Slashes). */
export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/u, '')}/${path.replace(/^\/+/u, '')}`;
}

/**
 * Fuehrt einen fetch mit hartem Timeout aus. Netzwerk- und Abort-Fehler
 * werden als HttpError weitergeworfen, damit Adapter sie einheitlich melden.
 */
export async function request(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    throw toHttpError(error, timeoutMs);
  } finally {
    clearTimeout(timer);
  }
}

/** Wirft einen HttpError, wenn die Antwort keinen Erfolgsstatus hat. */
export async function assertOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await safeText(res);
  throw new HttpError(`HTTP ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`, res.status);
}

/** Liest den Response-Body als JSON und wirft bei Parse-Fehlern. */
export async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(`Ungueltige JSON-Antwort: ${truncate(text)}`, res.status);
  }
}

/** Liest den Body defensiv als Text (leerer String bei Fehlern). */
export async function safeText(res: Response): Promise<string> {
  try {
    return truncate(await res.text());
  } catch {
    return '';
  }
}

/** Kuerzt lange Texte fuer Fehlermeldungen. */
export function truncate(value: string, max = 240): string {
  const compact = value.replace(/\s+/gu, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

/** Beschreibt einen unbekannten Fehler als lesbaren String. */
export function describeError(error: unknown, timeoutMs: number = DEFAULT_TIMEOUT_MS): string {
  if (error instanceof HttpError) return error.message;
  if (error instanceof Error) {
    if (error.name === 'AbortError') return `Timeout nach ${timeoutMs} ms`;
    return error.message;
  }
  return String(error);
}

/** Misst die Laufzeit einer async-Funktion in Millisekunden (gerundet). */
export async function measure<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = performance.now();
  const value = await fn();
  return { value, latencyMs: Math.round(performance.now() - start) };
}

function toHttpError(error: unknown, timeoutMs: number): HttpError {
  if (error instanceof Error && error.name === 'AbortError') {
    return new HttpError(`Timeout nach ${timeoutMs} ms`);
  }
  if (error instanceof Error) return new HttpError(error.message);
  return new HttpError(String(error));
}
