import pLimit from 'p-limit';

export type QueueStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'DONE';

export interface QueueState {
  status: QueueStatus;
  total: number;
  completed: number;
  failed: number;
  costUsd: number;
  budgetUsd: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
}

export interface QueueTaskOutcome {
  costUsd?: number;
}

export type QueueWorker = (id: string) => Promise<QueueTaskOutcome>;

export interface BatchQueueOptions {
  concurrency?: number;
}

class StoppedError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pausierbare Hintergrund-Queue (Stufe 2/3) mit `p-limit`, Live-Fortschritt und
 * automatischem Stop bei Erreichen des Kosten-Limits (Hard-Stop-Budget).
 */
export class BatchQueue {
  private state: QueueState = {
    status: 'IDLE',
    total: 0,
    completed: 0,
    failed: 0,
    costUsd: 0,
    budgetUsd: null,
    startedAt: null,
    finishedAt: null,
    lastError: null,
  };
  private paused = false;
  private stopped = false;
  private readonly concurrency: number;

  constructor(options: BatchQueueOptions = {}) {
    this.concurrency = options.concurrency ?? 5;
  }

  getState(): QueueState {
    return { ...this.state };
  }

  pause(): QueueState {
    if (this.state.status === 'RUNNING') {
      this.paused = true;
      this.state.status = 'PAUSED';
    }
    return this.getState();
  }

  resume(): QueueState {
    if (this.state.status === 'PAUSED') {
      this.paused = false;
      this.state.status = 'RUNNING';
    }
    return this.getState();
  }

  stop(): QueueState {
    this.stopped = true;
    if (this.state.status === 'RUNNING' || this.state.status === 'PAUSED') {
      this.state.status = 'STOPPED';
    }
    return this.getState();
  }

  async run(
    ids: string[],
    worker: QueueWorker,
    budgetUsd: number | null = null,
  ): Promise<QueueState> {
    if (this.state.status === 'RUNNING' || this.state.status === 'PAUSED') {
      throw new Error('Es laeuft bereits eine Queue.');
    }
    this.paused = false;
    this.stopped = false;
    this.state = {
      status: 'RUNNING',
      total: ids.length,
      completed: 0,
      failed: 0,
      costUsd: 0,
      budgetUsd,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      lastError: null,
    };

    const limit = pLimit(this.concurrency);
    const gate = async (): Promise<void> => {
      while (this.paused && !this.stopped) await sleep(100);
      if (this.stopped) throw new StoppedError('Queue gestoppt.');
    };

    await Promise.all(
      ids.map((id) =>
        limit(async () => {
          try {
            await gate();
            const outcome = await worker(id);
            this.state.completed += 1;
            if (typeof outcome.costUsd === 'number') this.state.costUsd += outcome.costUsd;
            if (budgetUsd !== null && this.state.costUsd > budgetUsd) {
              this.state.lastError = `Hard-Stop-Budget von ${budgetUsd} USD ueberschritten.`;
              this.stop();
            }
          } catch (error) {
            if (error instanceof StoppedError) return;
            this.state.failed += 1;
            this.state.lastError = error instanceof Error ? error.message : String(error);
          }
        }),
      ),
    );

    if (this.state.status !== 'STOPPED') this.state.status = 'DONE';
    this.state.finishedAt = new Date().toISOString();
    return this.getState();
  }
}
