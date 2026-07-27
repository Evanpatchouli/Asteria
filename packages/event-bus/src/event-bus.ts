import type { AgentEvent, AgentEventType } from "@asteria/shared";

export type AgentEventOf<TType extends AgentEventType> = AgentEvent & {
  type: TType;
};

export type AgentEventHandler<TType extends AgentEventType = AgentEventType> = (
  event: AgentEventOf<TType>,
) => Promise<void> | void;

export interface EventHandlerError {
  readonly error: unknown;
  readonly event: AgentEvent;
}

export interface EventBusOptions {
  /**
   * Receives isolated handler failures so the application can log them.
   * Errors thrown by this reporter are also isolated from event delivery.
   */
  readonly onHandlerError?: (failure: EventHandlerError) => void;
}

export interface EventBus {
  /**
   * Delivers an event after all previously emitted events have completed.
   */
  emit(event: AgentEvent): Promise<void>;

  /**
   * Subscribes a handler to one event type.
   *
   * @returns An idempotent function that removes the subscription.
   */
  on<TType extends AgentEventType>(
    type: TType,
    handler: AgentEventHandler<TType>,
  ): () => void;

  /**
   * Removes a previously registered handler.
   */
  off<TType extends AgentEventType>(
    type: TType,
    handler: AgentEventHandler<TType>,
  ): void;
}

type StoredHandler = AgentEventHandler<AgentEventType>;

/**
 * In-process Event Bus with serial, subscription-ordered delivery.
 */
export class InMemoryEventBus implements EventBus {
  readonly #handlers = new Map<AgentEventType, Set<StoredHandler>>();
  readonly #options: EventBusOptions;
  #deliveryQueue: Promise<void> = Promise.resolve();

  public constructor(options: EventBusOptions = {}) {
    this.#options = options;
  }

  public emit(event: AgentEvent): Promise<void> {
    const delivery = this.#deliveryQueue.then(() => this.#deliver(event));
    this.#deliveryQueue = delivery;
    return delivery;
  }

  public on<TType extends AgentEventType>(
    type: TType,
    handler: AgentEventHandler<TType>,
  ): () => void {
    const handlers = this.#handlers.get(type) ?? new Set<StoredHandler>();
    handlers.add(handler as StoredHandler);
    this.#handlers.set(type, handlers);

    let subscribed = true;

    return () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;
      this.off(type, handler);
    };
  }

  public off<TType extends AgentEventType>(
    type: TType,
    handler: AgentEventHandler<TType>,
  ): void {
    const handlers = this.#handlers.get(type);

    if (handlers === undefined) {
      return;
    }

    handlers.delete(handler as StoredHandler);

    if (handlers.size === 0) {
      this.#handlers.delete(type);
    }
  }

  async #deliver(event: AgentEvent): Promise<void> {
    const handlers = [...(this.#handlers.get(event.type) ?? [])];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error: unknown) {
        this.#reportHandlerError({
          error,
          event,
        });
      }
    }
  }

  #reportHandlerError(failure: EventHandlerError): void {
    try {
      this.#options.onHandlerError?.(failure);
    } catch {
      // Error reporting must never interrupt event delivery.
    }
  }
}
