import type { DebugApi } from "@asteria/shared";

declare global {
  interface Window {
    readonly debugApi: DebugApi;
  }
}

export {};
