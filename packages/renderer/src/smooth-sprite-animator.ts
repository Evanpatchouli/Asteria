import { Container, Sprite, type Texture } from "pixi.js";

import { KeyframeTimeline } from "./keyframe-timeline.js";

/**
 * Keyframe sequence consumed by the 60Hz sprite transition renderer.
 */
export interface SmoothSpriteAnimation {
  /** Number of authored keyframe intervals advanced per second. */
  readonly frameRate: number;
  /** Whether the sequence wraps from its last keyframe to its first. */
  readonly loop: boolean;
  /** Ordered keyframe textures, including intentional repeated holds. */
  readonly textures: readonly Texture[];
}

/**
 * Renders fixed-rate keyframes as a smooth two-sprite transition.
 *
 * At least one pose remains fully opaque throughout each transition. This
 * avoids the washed-out silhouette produced by a conventional alpha crossfade,
 * at the cost of a short, intentional overlap between adjacent poses.
 */
export class SmoothSpriteAnimator {
  readonly #fromSprite: Sprite;
  readonly #toSprite: Sprite;
  readonly #view: Container;
  #animation: SmoothSpriteAnimation;
  #destroyed = false;
  #timeline: KeyframeTimeline;

  public constructor(animation: SmoothSpriteAnimation) {
    validateAnimation(animation);

    this.#animation = animation;
    this.#timeline = createTimeline(animation);
    this.#fromSprite = new Sprite(animation.textures[0]);
    this.#toSprite = new Sprite(animation.textures[0]);
    this.#view = new Container({
      children: [this.#fromSprite, this.#toSprite],
      eventMode: "none",
      visible: false,
    });
    this.#fromSprite.eventMode = "none";
    this.#toSprite.eventMode = "none";
    this.#applySnapshot(this.#timeline.snapshot());
  }

  /**
   * Root display object used to position and scale both interpolated poses.
   */
  public get view(): Container {
    return this.#view;
  }

  /**
   * Starts an animation from its first keyframe.
   */
  public play(animation: SmoothSpriteAnimation): void {
    this.#assertAlive();
    validateAnimation(animation);
    this.#animation = animation;
    this.#timeline = createTimeline(animation);
    this.#view.visible = true;
    this.#applySnapshot(this.#timeline.play());
  }

  /**
   * Stops playback and hides both pose sprites.
   */
  public stop(): void {
    this.#assertAlive();
    this.#timeline.stop();
    this.#view.visible = false;
  }

  /**
   * Advances the active transition using PixiJS ticker delta milliseconds.
   */
  public update(deltaMs: number): void {
    this.#assertAlive();
    this.#applySnapshot(this.#timeline.advance(deltaMs));
  }

  /**
   * Releases display objects without destroying package-owned textures.
   */
  public destroy(): void {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    this.#view.removeFromParent();
    this.#view.destroy({
      children: true,
      texture: false,
      textureSource: false,
    });
  }

  #applySnapshot(snapshot: {
    readonly fromIndex: number;
    readonly progress: number;
    readonly toIndex: number;
  }): void {
    const fromTexture = this.#animation.textures[snapshot.fromIndex];
    const toTexture = this.#animation.textures[snapshot.toIndex];

    if (!fromTexture || !toTexture) {
      throw new Error("Animation timeline referenced a missing texture.");
    }

    applyTexture(this.#fromSprite, fromTexture);
    applyTexture(this.#toSprite, toTexture);

    if (fromTexture === toTexture || snapshot.progress === 0) {
      this.#fromSprite.alpha = 1;
      this.#toSprite.alpha = 0;
      this.#toSprite.visible = false;
      return;
    }

    const progress = smoothstep(snapshot.progress);

    this.#toSprite.visible = true;

    if (progress < 0.5) {
      this.#fromSprite.alpha = 1;
      this.#toSprite.alpha = smoothstep(progress * 2);
    } else {
      this.#fromSprite.alpha = smoothstep((1 - progress) * 2);
      this.#toSprite.alpha = 1;
    }
  }

  #assertAlive(): void {
    if (this.#destroyed) {
      throw new Error("SmoothSpriteAnimator has been destroyed.");
    }
  }
}

function applyTexture(sprite: Sprite, texture: Texture): void {
  sprite.texture = texture;
  sprite.anchor.copyFrom(texture.defaultAnchor ?? { x: 0.5, y: 0.5 });
}

function createTimeline(animation: SmoothSpriteAnimation): KeyframeTimeline {
  return new KeyframeTimeline(
    animation.textures.length,
    animation.frameRate,
    animation.loop,
  );
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function validateAnimation(animation: SmoothSpriteAnimation): void {
  if (animation.textures.length === 0) {
    throw new TypeError("animation textures must not be empty.");
  }

  if (!Number.isFinite(animation.frameRate) || animation.frameRate <= 0) {
    throw new RangeError(
      "animation frameRate must be a positive finite number.",
    );
  }
}
