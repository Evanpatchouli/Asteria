import { describe, expect, it } from "vitest";

import { PetStateMachine } from "./state-machine.js";

describe("PetStateMachine", () => {
  it("starts in idle by default", () => {
    expect(new PetStateMachine().current()).toBe("idle");
  });

  it("allows higher-priority states to interrupt lower-priority states", () => {
    const machine = new PetStateMachine("thinking");

    expect(machine.transition("coding")).toEqual({
      status: "changed",
      from: "thinking",
      to: "coding",
    });
    expect(machine.current()).toBe("coding");
  });

  it("blocks lower-priority states", () => {
    const machine = new PetStateMachine("error");

    expect(machine.transition("happy")).toEqual({
      status: "unchanged",
      reason: "lower-priority",
      state: "error",
    });
    expect(machine.current()).toBe("error");
  });

  it("treats coding and tooling as equal-priority interruptible states", () => {
    const machine = new PetStateMachine("coding");

    expect(machine.transition("tooling")).toEqual({
      status: "changed",
      from: "coding",
      to: "tooling",
    });
    expect(machine.transition("coding")).toEqual({
      status: "changed",
      from: "tooling",
      to: "coding",
    });
  });

  it("supports explicit forced resets", () => {
    const machine = new PetStateMachine("error");

    expect(machine.transition("idle", { force: true })).toEqual({
      status: "changed",
      from: "error",
      to: "idle",
    });
  });

  it("does not report the same state as a transition", () => {
    const machine = new PetStateMachine("coding");

    expect(machine.transition("coding")).toEqual({
      status: "unchanged",
      reason: "same-state",
      state: "coding",
    });
  });
});
