import { describe, expect, it } from "vitest";

import {
  PET_MANIFEST_PROTOCOL_VERSION,
  parsePetManifest,
} from "./pet-manifest.js";

const validManifest = {
  id: "default",
  name: "Default Pet",
  version: "0.1.0",
  protocolVersion: PET_MANIFEST_PROTOCOL_VERSION,
  renderer: "pixijs",
  states: {
    idle: "idle",
    thinking: "thinking",
    coding: "coding",
    tooling: "tooling",
    happy: "happy",
    error: "error",
  },
  animations: {
    idle: { source: "animations/idle.json", loop: true, frameRate: 8 },
    thinking: {
      source: "animations/thinking.json",
      loop: true,
      frameRate: 8,
    },
    coding: { source: "animations/coding.json", loop: true, frameRate: 12 },
    tooling: {
      source: "animations/tooling.json",
      loop: true,
      frameRate: 10,
    },
    happy: { source: "animations/happy.json", loop: false, frameRate: 12 },
    error: { source: "animations/error.json", loop: false, frameRate: 8 },
  },
} as const;

describe("parsePetManifest", () => {
  it("accepts a complete PixiJS pet manifest", () => {
    expect(parsePetManifest(validManifest).renderer).toBe("pixijs");
  });

  it("rejects a state mapped to an unknown animation", () => {
    expect(() =>
      parsePetManifest({
        ...validManifest,
        states: {
          ...validManifest.states,
          coding: "missing",
        },
      }),
    ).toThrow(/unknown animation/);
  });

  it("rejects the obsolete 1.0 protocol", () => {
    expect(() =>
      parsePetManifest({
        ...validManifest,
        protocolVersion: "1.0",
      }),
    ).toThrow();
  });

  it("requires a tooling state animation", () => {
    expect(() =>
      parsePetManifest({
        ...validManifest,
        states: {
          coding: validManifest.states.coding,
          error: validManifest.states.error,
          happy: validManifest.states.happy,
          idle: validManifest.states.idle,
          thinking: validManifest.states.thinking,
        },
      }),
    ).toThrow();
  });

  it("rejects a renderer outside the Phase 1 scope", () => {
    expect(() =>
      parsePetManifest({
        ...validManifest,
        renderer: "live2d",
      }),
    ).toThrow();
  });
});
