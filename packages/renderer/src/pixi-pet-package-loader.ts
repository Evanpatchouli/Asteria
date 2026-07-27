import { parsePetManifest, type PetManifest } from "@asteria/shared";
import {
  Spritesheet,
  Texture,
  type SpritesheetData,
  type Texture as PixiTexture,
} from "pixi.js";

export interface LoadedPixiAnimation {
  readonly frameRate: number;
  readonly loop: boolean;
  readonly textures: readonly PixiTexture[];
}

export interface LoadedPixiPetPackage {
  readonly animations: ReadonlyMap<string, LoadedPixiAnimation>;
  readonly manifest: PetManifest;
  destroy(): void;
}

type ValidatedSpritesheetData = SpritesheetData & {
  readonly meta: SpritesheetData["meta"] & {
    readonly image: string;
  };
};

/**
 * Loads and validates one PixiJS pet package from its Manifest URL.
 */
export async function loadPixiPetPackage(
  manifestUrl: string,
): Promise<LoadedPixiPetPackage> {
  const normalizedManifestUrl = new URL(manifestUrl, window.location.href);
  const manifest = parsePetManifest(
    await fetchJson(normalizedManifestUrl, "pet manifest"),
  );
  const sheets: Spritesheet[] = [];
  const animations = new Map<string, LoadedPixiAnimation>();

  try {
    for (const [action, animation] of Object.entries(manifest.animations)) {
      const atlasUrl = new URL(animation.source, normalizedManifestUrl);
      const atlas = parseAtlasDocument(
        await fetchJson(atlasUrl, `animation "${action}"`),
        action,
      );
      const imageUrl = new URL(atlas.meta.image, atlasUrl);
      const image = await loadImage(imageUrl);
      const texture = Texture.from(image);
      const sheet = new Spritesheet(texture, atlas);

      sheets.push(sheet);
      await sheet.parse();

      const textures = sheet.animations[action];

      if (!textures || textures.length === 0) {
        throw new Error(
          `Animation "${action}" does not contain a non-empty "${action}" sequence.`,
        );
      }

      animations.set(action, {
        frameRate: animation.frameRate,
        loop: animation.loop,
        textures,
      });
    }
  } catch (error: unknown) {
    destroySheets(sheets);
    throw error;
  }

  let destroyed = false;

  return {
    animations,
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      destroySheets(sheets);
    },
    manifest,
  };
}

async function fetchJson(url: URL, label: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to load ${label} from ${url.href}: ${response.status} ${response.statusText}.`,
    );
  }

  return response.json() as Promise<unknown>;
}

async function loadImage(url: URL): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = url.href;

  try {
    await image.decode();
  } catch (error: unknown) {
    throw new Error(`Failed to load texture image from ${url.href}.`, {
      cause: error,
    });
  }

  return image;
}

function parseAtlasDocument(
  input: unknown,
  action: string,
): ValidatedSpritesheetData {
  if (
    !isRecord(input) ||
    !isRecord(input.frames) ||
    !isRecord(input.animations) ||
    !isRecord(input.meta) ||
    typeof input.meta.image !== "string" ||
    input.meta.image.length === 0
  ) {
    throw new TypeError(`Animation "${action}" has an invalid PixiJS atlas.`);
  }

  const sequence = input.animations[action];

  if (
    !Array.isArray(sequence) ||
    sequence.length === 0 ||
    sequence.some((frame) => typeof frame !== "string")
  ) {
    throw new TypeError(
      `Animation "${action}" must declare a non-empty "${action}" frame sequence.`,
    );
  }

  return input as unknown as ValidatedSpritesheetData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function destroySheets(sheets: readonly Spritesheet[]): void {
  for (const sheet of sheets) {
    sheet.destroy(true);
  }
}
