import { Graphics, Sprite, type Renderer } from "pixi.js";

/**
 * Creates the temporary Phase 1 character as a generated Sprite texture.
 */
export function createPlaceholderSprite(renderer: Renderer): Sprite {
  const artwork = new Graphics()
    .ellipse(64, 118, 42, 8)
    .fill({ alpha: 0.2, color: 0x05070b })
    .roundRect(10, 14, 108, 100, 40)
    .fill({ color: 0x11141c })
    .stroke({ alpha: 0.72, color: 0x485466, width: 2 })
    .circle(64, 12, 8)
    .fill({ color: 0x8ee8d4 })
    .circle(43, 61, 7)
    .fill({ color: 0xf4f6f8 })
    .circle(85, 61, 7)
    .fill({ color: 0xf4f6f8 })
    .roundRect(45, 85, 38, 5, 2.5)
    .fill({ alpha: 0.42, color: 0x8ee8d4 });
  const texture = renderer.generateTexture({
    antialias: true,
    defaultAnchor: { x: 0.5, y: 0.5 },
    resolution: 2,
    target: artwork,
  });
  const sprite = new Sprite(texture);

  artwork.destroy();
  sprite.eventMode = "none";

  return sprite;
}
