import type { PetRendererPort } from "@asteria/pet-runtime";
import "pixi.js/unsafe-eval";
import { Application, type Sprite, type Ticker } from "pixi.js";

import {
  PLACEHOLDER_STATE_ACTIONS,
  type PlaceholderAction,
} from "./placeholder-actions.js";
import { createPlaceholderSprite } from "./placeholder-sprite.js";

const MAXIMUM_FRAMES_PER_SECOND = 60;

type RendererStatus = "created" | "destroyed" | "initializing" | "ready";

export interface PixiPetRendererOptions {
  readonly host: HTMLElement;
  readonly resolution?: number;
}

/**
 * PixiJS implementation of the Pet Runtime's minimum renderer port.
 */
export class PixiPetRenderer implements PetRendererPort {
  readonly #host: HTMLElement;
  readonly #resolution: number;
  #activeAction: string | undefined;
  #application: Application | undefined;
  #elapsedMilliseconds = 0;
  #initialization: Promise<void> | undefined;
  #sprite: Sprite | undefined;
  #status: RendererStatus = "created";

  public constructor(options: PixiPetRendererOptions) {
    if (
      options.resolution !== undefined &&
      (!Number.isFinite(options.resolution) || options.resolution <= 0)
    ) {
      throw new RangeError("resolution must be a positive finite number.");
    }

    this.#host = options.host;
    this.#resolution = options.resolution ?? window.devicePixelRatio;
  }

  /**
   * Initializes a transparent WebGL canvas and starts its private ticker.
   */
  public initialize(): Promise<void> {
    if (this.#status === "destroyed") {
      return Promise.reject(new Error("PixiPetRenderer has been destroyed."));
    }

    if (this.#initialization !== undefined) {
      return this.#initialization;
    }

    const application = new Application();

    this.#application = application;
    this.#status = "initializing";
    this.#initialization = this.#initializeApplication(application).catch(
      (error: unknown) => {
        if (this.#status !== "destroyed") {
          this.#status = "created";
          this.#initialization = undefined;
        }

        throw error;
      },
    );

    return this.#initialization;
  }

  /**
   * Starts or replaces the current placeholder action.
   */
  public play(action: string): void {
    this.#assertReady();

    if (action.trim().length === 0) {
      throw new TypeError("action must not be empty.");
    }

    this.#activeAction = action;
    this.#elapsedMilliseconds = 0;

    if (this.#sprite) {
      this.#sprite.visible = true;
    }
  }

  /**
   * Stops an action when it is currently active.
   */
  public stop(action: string): void {
    this.#assertReady();

    if (this.#activeAction !== action) {
      return;
    }

    this.#activeAction = undefined;
    this.#elapsedMilliseconds = 0;
    this.#resetSpriteTransform();

    if (this.#sprite) {
      this.#sprite.visible = false;
    }
  }

  /**
   * Stops the ticker and releases the canvas, scene, texture, and GPU context.
   */
  public destroy(): void {
    if (this.#status === "destroyed") {
      return;
    }

    const wasReady = this.#status === "ready";
    const application = this.#application;

    this.#status = "destroyed";
    this.#activeAction = undefined;

    if (wasReady && application) {
      this.#releaseApplication(application, true);
    }
  }

  async #initializeApplication(application: Application): Promise<void> {
    let initialized = false;

    try {
      await application.init({
        antialias: true,
        autoDensity: true,
        autoStart: false,
        backgroundAlpha: 0,
        powerPreference: "low-power",
        preference: "webgl",
        resizeTo: this.#host,
        resolution: this.#resolution,
        sharedTicker: false,
      });
      initialized = true;

      if (this.#status === "destroyed" || this.#application !== application) {
        this.#releaseApplication(application, true);
        return;
      }

      const sprite = createPlaceholderSprite(application.renderer);

      this.#sprite = sprite;
      sprite.visible = false;
      application.stage.eventMode = "none";
      application.stage.addChild(sprite);
      application.canvas.classList.add("pixi-canvas");
      application.ticker.maxFPS = MAXIMUM_FRAMES_PER_SECOND;
      application.ticker.add(this.#update);
      this.#host.replaceChildren(application.canvas);
      this.#status = "ready";
      application.start();
    } catch (error: unknown) {
      this.#releaseApplication(application, initialized);
      throw error;
    }
  }

  readonly #update = (ticker: Ticker): void => {
    const application = this.#application;
    const sprite = this.#sprite;

    if (!application || !sprite) {
      return;
    }

    this.#elapsedMilliseconds += ticker.deltaMS;
    const elapsedSeconds = this.#elapsedMilliseconds / 1_000;
    const action = this.#activeAction;
    const motion = resolvePlaceholderMotion(action, elapsedSeconds);

    sprite.position.set(
      application.screen.width / 2 + motion.offsetX,
      application.screen.height / 2 + motion.offsetY,
    );
    sprite.rotation = motion.rotation;
    sprite.scale.set(motion.scaleX, motion.scaleY);
  };

  #assertReady(): void {
    if (this.#status !== "ready") {
      throw new Error("PixiPetRenderer must be initialized before use.");
    }
  }

  #resetSpriteTransform(): void {
    const application = this.#application;
    const sprite = this.#sprite;

    if (!application || !sprite) {
      return;
    }

    sprite.position.set(
      application.screen.width / 2,
      application.screen.height / 2,
    );
    sprite.rotation = 0;
    sprite.scale.set(1);
  }

  #releaseApplication(application: Application, initialized: boolean): void {
    if (this.#application === application) {
      this.#application = undefined;
      this.#sprite = undefined;
    }

    try {
      if (initialized) {
        application.stop();
        application.ticker.remove(this.#update);
      }

      application.destroy(
        { removeView: true },
        { children: true, context: true, texture: true, textureSource: true },
      );
    } catch {
      // Preserve the original initialization failure after best-effort cleanup.
    }
  }
}

interface PlaceholderMotion {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly rotation: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

function resolvePlaceholderMotion(
  action: string | undefined,
  elapsedSeconds: number,
): PlaceholderMotion {
  const normalizedAction = action as PlaceholderAction | undefined;

  switch (normalizedAction) {
    case PLACEHOLDER_STATE_ACTIONS.coding:
      return {
        offsetX: Math.sin(elapsedSeconds * 18) * 2,
        offsetY: Math.sin(elapsedSeconds * 9) * 2,
        rotation: Math.sin(elapsedSeconds * 18) * 0.015,
        scaleX: 1,
        scaleY: 1,
      };
    case PLACEHOLDER_STATE_ACTIONS.error:
      return {
        offsetX: Math.sin(elapsedSeconds * 32) * 5,
        offsetY: 2,
        rotation: Math.sin(elapsedSeconds * 20) * 0.025,
        scaleX: 1,
        scaleY: 0.96,
      };
    case PLACEHOLDER_STATE_ACTIONS.happy: {
      const bounce = Math.abs(Math.sin(elapsedSeconds * 5));

      return {
        offsetX: 0,
        offsetY: -bounce * 18,
        rotation: Math.sin(elapsedSeconds * 5) * 0.08,
        scaleX: 1 + bounce * 0.06,
        scaleY: 1 - bounce * 0.04,
      };
    }
    case PLACEHOLDER_STATE_ACTIONS.thinking:
      return {
        offsetX: Math.sin(elapsedSeconds * 1.7) * 3,
        offsetY: Math.sin(elapsedSeconds * 2.2) * 4,
        rotation: Math.sin(elapsedSeconds * 1.7) * 0.06,
        scaleX: 1,
        scaleY: 1,
      };
    case PLACEHOLDER_STATE_ACTIONS.idle:
    default: {
      const breath = Math.sin(elapsedSeconds * 2.4);

      return {
        offsetX: 0,
        offsetY: breath * 4,
        rotation: 0,
        scaleX: 1 + breath * 0.015,
        scaleY: 1 - breath * 0.015,
      };
    }
  }
}
