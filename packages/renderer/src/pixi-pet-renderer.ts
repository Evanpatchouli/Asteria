import type { PetRendererPort } from "@asteria/pet-runtime";
import "pixi.js/unsafe-eval";
import { Application, type Ticker } from "pixi.js";

import type {
  LoadedPixiAnimation,
  LoadedPixiPetPackage,
} from "./pixi-pet-package-loader.js";
import { SmoothSpriteAnimator } from "./smooth-sprite-animator.js";

const MAXIMUM_FRAMES_PER_SECOND = 60;
const VIEWPORT_FILL_RATIO = 0.36;

type RendererStatus = "created" | "destroyed" | "initializing" | "ready";

export interface PixiPetRendererOptions {
  readonly host: HTMLElement;
  readonly package: LoadedPixiPetPackage;
  readonly resolution?: number;
}

/**
 * Smooth PixiJS sprite implementation of the Pet Runtime renderer port.
 */
export class PixiPetRenderer implements PetRendererPort {
  readonly #host: HTMLElement;
  readonly #maximumFrameHeight: number;
  readonly #maximumFrameWidth: number;
  readonly #package: LoadedPixiPetPackage;
  readonly #resolution: number;
  #activeAction: string | undefined;
  #application: Application | undefined;
  #initialization: Promise<void> | undefined;
  #animator: SmoothSpriteAnimator | undefined;
  #status: RendererStatus = "created";

  public constructor(options: PixiPetRendererOptions) {
    if (
      options.resolution !== undefined &&
      (!Number.isFinite(options.resolution) || options.resolution <= 0)
    ) {
      throw new RangeError("resolution must be a positive finite number.");
    }

    this.#host = options.host;
    this.#package = options.package;
    this.#maximumFrameHeight = maximumFrameDimension(options.package, "height");
    this.#maximumFrameWidth = maximumFrameDimension(options.package, "width");
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
   * Starts or replaces the current Manifest animation.
   */
  public play(action: string): void {
    this.#assertReady();

    if (action.trim().length === 0) {
      throw new TypeError("action must not be empty.");
    }

    const animation = this.#animationFor(action);
    const animator = this.#animator;

    if (!animator) {
      throw new Error("PixiPetRenderer animation renderer is unavailable.");
    }

    this.#activeAction = action;
    animator.play(animation);
    this.#layoutAnimator();
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

    this.#animator?.stop();
  }

  /**
   * Stops animation and releases the canvas, atlases, and GPU context.
   */
  public destroy(): void {
    if (this.#status === "destroyed") {
      return;
    }

    const previousStatus = this.#status;
    const application = this.#application;

    this.#status = "destroyed";
    this.#activeAction = undefined;

    if (previousStatus === "ready" && application) {
      this.#releaseApplication(application, true);
      this.#package.destroy();
      return;
    }

    if (previousStatus === "created") {
      this.#package.destroy();
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
        this.#package.destroy();
        return;
      }

      const initialAnimation = this.#package.animations.values().next().value;

      if (!initialAnimation) {
        throw new Error("The pet package does not contain any animations.");
      }

      const animator = new SmoothSpriteAnimator(initialAnimation);

      this.#animator = animator;
      application.stage.eventMode = "none";
      application.stage.addChild(animator.view);
      application.canvas.classList.add("pixi-canvas");
      application.ticker.maxFPS = MAXIMUM_FRAMES_PER_SECOND;
      application.ticker.add(this.#update);
      this.#host.replaceChildren(application.canvas);
      this.#status = "ready";
      this.#layoutAnimator();
      application.start();
    } catch (error: unknown) {
      this.#releaseApplication(application, initialized);

      if (this.#status === "destroyed") {
        this.#package.destroy();
      }

      throw error;
    }
  }

  readonly #update = (ticker: Ticker): void => {
    this.#animator?.update(ticker.deltaMS);
    this.#layoutAnimator();
  };

  #animationFor(action: string): LoadedPixiAnimation {
    const animation = this.#package.animations.get(action);

    if (!animation) {
      throw new Error(`Unknown pet animation "${action}".`);
    }

    return animation;
  }

  #assertReady(): void {
    if (this.#status !== "ready") {
      throw new Error("PixiPetRenderer must be initialized before use.");
    }
  }

  #layoutAnimator(): void {
    const application = this.#application;
    const animator = this.#animator;

    if (!application || !animator) {
      return;
    }

    const scale =
      Math.min(
        application.screen.width / this.#maximumFrameWidth,
        application.screen.height / this.#maximumFrameHeight,
      ) * VIEWPORT_FILL_RATIO;

    animator.view.position.set(
      application.screen.width / 2,
      application.screen.height / 2,
    );
    animator.view.scale.set(scale);
  }

  #releaseApplication(application: Application, initialized: boolean): void {
    if (this.#application === application) {
      this.#application = undefined;
      this.#animator?.destroy();
      this.#animator = undefined;
    }

    try {
      if (initialized) {
        application.stop();
        application.ticker.remove(this.#update);
      }

      application.destroy(
        { removeView: true },
        {
          children: true,
          context: true,
          texture: false,
          textureSource: false,
        },
      );
    } catch {
      // Preserve the original initialization failure after best-effort cleanup.
    }
  }
}

function maximumFrameDimension(
  petPackage: LoadedPixiPetPackage,
  dimension: "height" | "width",
): number {
  let maximum = 1;

  for (const animation of petPackage.animations.values()) {
    for (const texture of animation.textures) {
      maximum = Math.max(maximum, texture.orig[dimension]);
    }
  }

  return maximum;
}
