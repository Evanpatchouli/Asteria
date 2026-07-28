export interface KeyframeTimelineSnapshot {
  readonly fromIndex: number;
  readonly playing: boolean;
  readonly progress: number;
  readonly toIndex: number;
}

/**
 * Advances a fixed-rate keyframe sequence using elapsed milliseconds.
 *
 * The timeline is renderer-agnostic so display implementations can interpolate
 * at their own refresh rate without changing the source animation frame rate.
 */
export class KeyframeTimeline {
  readonly #frameCount: number;
  readonly #frameDurationMs: number;
  readonly #loop: boolean;
  #elapsedMs = 0;
  #playing = false;

  public constructor(frameCount: number, frameRate: number, loop: boolean) {
    if (!Number.isInteger(frameCount) || frameCount <= 0) {
      throw new RangeError("frameCount must be a positive integer.");
    }

    if (!Number.isFinite(frameRate) || frameRate <= 0) {
      throw new RangeError("frameRate must be a positive finite number.");
    }

    this.#frameCount = frameCount;
    this.#frameDurationMs = 1_000 / frameRate;
    this.#loop = loop;
  }

  /**
   * Restarts playback from the first keyframe.
   */
  public play(): KeyframeTimelineSnapshot {
    this.#elapsedMs = 0;
    this.#playing = this.#frameCount > 1;
    return this.snapshot();
  }

  /**
   * Pauses playback at its current interpolated position.
   */
  public stop(): KeyframeTimelineSnapshot {
    this.#playing = false;
    return this.snapshot();
  }

  /**
   * Advances playback by an elapsed real-time duration.
   */
  public advance(deltaMs: number): KeyframeTimelineSnapshot {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new RangeError("deltaMs must be a non-negative finite number.");
    }

    if (!this.#playing || deltaMs === 0) {
      return this.snapshot();
    }

    this.#elapsedMs += deltaMs;

    if (this.#loop) {
      this.#elapsedMs %= this.#frameCount * this.#frameDurationMs;
    } else {
      const finalFrameTime = (this.#frameCount - 1) * this.#frameDurationMs;

      if (this.#elapsedMs >= finalFrameTime) {
        this.#elapsedMs = finalFrameTime;
        this.#playing = false;
      }
    }

    return this.snapshot();
  }

  /**
   * Returns the current keyframe pair and normalized transition progress.
   */
  public snapshot(): KeyframeTimelineSnapshot {
    if (this.#frameCount === 1) {
      return {
        fromIndex: 0,
        playing: false,
        progress: 0,
        toIndex: 0,
      };
    }

    if (!this.#loop && !this.#playing) {
      const finalFrameTime = (this.#frameCount - 1) * this.#frameDurationMs;

      if (this.#elapsedMs >= finalFrameTime) {
        const finalIndex = this.#frameCount - 1;
        return {
          fromIndex: finalIndex,
          playing: false,
          progress: 0,
          toIndex: finalIndex,
        };
      }
    }

    const rawFramePosition = this.#elapsedMs / this.#frameDurationMs;
    const nearestFrame = Math.round(rawFramePosition);
    const framePosition =
      Math.abs(rawFramePosition - nearestFrame) < 1e-9
        ? nearestFrame
        : rawFramePosition;
    const rawFromIndex = Math.floor(framePosition);
    const progress = framePosition - rawFromIndex;
    const fromIndex = this.#loop
      ? rawFromIndex % this.#frameCount
      : Math.min(rawFromIndex, this.#frameCount - 1);
    const toIndex = this.#loop
      ? (fromIndex + 1) % this.#frameCount
      : Math.min(fromIndex + 1, this.#frameCount - 1);

    return {
      fromIndex,
      playing: this.#playing,
      progress,
      toIndex,
    };
  }
}
