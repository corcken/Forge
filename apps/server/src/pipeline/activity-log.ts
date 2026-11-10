export type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';
export type LogScope = 'QUEUE' | 'INGEST' | 'AI' | 'COMPILE' | 'SYSTEM';

export interface ActivityLogEntry {
  seq: number;
  timestamp: string;
  level: LogLevel;
  scope: LogScope;
  message: string;
}

/**
 * In-Memory Ringpuffer-Protokoll fuer das Live-Terminal im Frontend.
 * Speichert die letzten `maxEntries` Ereignisse aus Ingestion, KI und Compiler.
 */
export class ActivityLogService {
  private entries: ActivityLogEntry[] = [];
  private seq = 1;
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  log(level: LogLevel, scope: LogScope, message: string): ActivityLogEntry {
    const entry: ActivityLogEntry = {
      seq: this.seq++,
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
    return entry;
  }

  info(scope: LogScope, message: string): void {
    this.log('INFO', scope, message);
  }

  ok(scope: LogScope, message: string): void {
    this.log('OK', scope, message);
  }

  warn(scope: LogScope, message: string): void {
    this.log('WARN', scope, message);
  }

  error(scope: LogScope, message: string): void {
    this.log('ERROR', scope, message);
  }

  list(afterSeq = 0, limit = 300): ActivityLogEntry[] {
    const filtered = afterSeq > 0 ? this.entries.filter((e) => e.seq > afterSeq) : this.entries;
    return filtered.slice(-limit);
  }

  clear(): void {
    this.entries = [];
  }
}
