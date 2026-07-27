import type { PetRendererPort } from "@asteria/pet-runtime";
import "pixi.js/unsafe-eval";
import { AnimatedSprite, Application, type Ticker } from "pixi.js";

import type {
  LoadedPixiAnimation,
  LoadedPixiPetPackage,
} from "./pixi-pet-package-loader.js";

const MAXIMUM_FRAMES_PER_SECOND = 60;
const VIEWPORT_FILL_RATIO = 0.36;

type RendererStatus = "created" | "destroyed" | "initializing" | "ready";

export interface PixiPetRendererOptions {
  readonly host: HTMLElement;
  readonly package: LoadedPixiPetPackage;
  readonly resolution?: number;
}

/**
 * PixiJS AnimatedSprite implementation of the Pet Runtime renderer port.
 */
export class PixiPetRenderer implements PetRendererPort {
  readonly #host: HTMLElement;
  readonly #package: LoadedPixiPetPackage;
  readonly #resolution: number;
  #activeAction: string | undefined;
  #application: Application | undefined;
  #initialization: Promise<void> | undefined;
  #sprite: AnimatedSprite | undefined;
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
    const sprite = this.#sprite;

    if (!sprite) {
      throw new Error("PixiPetRenderer animation sprite is unavailable.");
    }

    this.#activeAction = action;
    sprite.stop();
    sprite.textures = [...animation.textures];
    sprite.animationSpeed = animation.frameRate / MAXIMUM_FRAMES_PER_SECOND;
    sprite.loop = animation.loop;
    sprite.visible = true;
    sprite.gotoAndPlay(0);
    this.#layoutSprite();
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

    if (this.#sprite) {
      this.#sprite.stop();
      this.#sprite.visible = false;
    }
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

      const sprite = new AnimatedSprite({
        autoUpdate: false,
        textures: [...initialAnimation.textures],
      });

      this.#sprite = sprite;
      sprite.anchor.set(0.5);
      sprite.eventMode = "none";
      sprite.visible = false;
      application.stage.eventMode = "none";
      application.stage.addChild(sprite);
      application.canvas.classList.add("pixi-canvas");
      application.ticker.maxFPS = MAXIMUM_FRAMES_PER_SECOND;
      application.ticker.add(this.#update);
      this.#host.replaceChildren(application.canvas);
      this.#status = "ready";
      this.#layoutSprite();
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
    this.#sprite?.update(ticker);
    this.#layoutSprite();
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

  #layoutSprite(): void {
    const application = this.#application;
    const sprite = this.#sprite;

    if (!application || !sprite) {
      return;
    }

    const frameWidth = sprite.texture.orig.width;
    const frameHeight = sprite.texture.orig.height;
    const scale =
      Math.min(
        application.screen.width / frameWidth,
        application.screen.height / frameHeight,
      ) * VIEWPORT_FILL_RATIO;

    sprite.position.set(
      application.screen.width / 2,
      application.screen.height / 2,
    );
    sprite.scale.set(scale);
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
