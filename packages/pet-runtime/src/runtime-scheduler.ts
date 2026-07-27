export type CancelScheduledTask = () => void;
export type ScheduledTask = () => void;

/**
 * Environment-owned scheduling capability used for transient state fallback.
 */
export interface RuntimeScheduler {
  schedule(delayMs: number, task: ScheduledTask): CancelScheduledTask;
}
