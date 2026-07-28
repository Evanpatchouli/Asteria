import { describe, expect, it } from "vitest";

import { KeyframeTimeline } from "./keyframe-timeline.js";

describe("KeyframeTimeline", () => {
  it("wraps a looping sequence back to the first keyframe", () => {
    const timeline = new KeyframeTimeline(3, 10, true);

    timeline.play();

    expect(timeline.advance(250)).toMatchObject({
      fromIndex: 2,
      progress: 0.5,
      toIndex: 0,
    });
    expect(timeline.advance(50)).toMatchObject({
      fromIndex: 0,
      progress: 0,
      toIndex: 1,
    });
  });

  it("holds the final keyframe when a non-looping sequence completes", () => {
    const timeline = new KeyframeTimeline(3, 10, false);

    timeline.play();

    expect(timeline.advance(250)).toEqual({
      fromIndex: 2,
      playing: false,
      progress: 0,
      toIndex: 2,
    });
  });

  it("keeps repeated sequence entries as distinct timeline intervals", () => {
    const textureIds = ["rest", "rest", "tail"];
    const timeline = new KeyframeTimeline(textureIds.length, 5, true);

    timeline.play();
    const repeatedInterval = timeline.advance(100);

    expect(textureIds[repeatedInterval.fromIndex]).toBe("rest");
    expect(textureIds[repeatedInterval.toIndex]).toBe("rest");
    expect(repeatedInterval.progress).toBeCloseTo(0.5);
  });

  it("advances from 60Hz delta values using elapsed time", () => {
    const timeline = new KeyframeTimeline(6, 6, true);

    timeline.play();

    let snapshot = timeline.snapshot();

    for (let tick = 0; tick < 60; tick += 1) {
      snapshot = timeline.advance(1_000 / 60);
    }

    expect(snapshot.fromIndex).toBe(0);
    expect(snapshot.toIndex).toBe(1);
    expect(snapshot.progress).toBeCloseTo(0, 8);
  });
});
