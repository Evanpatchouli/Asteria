import type { DebugTelemetryApi, DesktopApi } from "@asteria/shared";

declare global {
  interface Window {
    readonly desktopApi: DesktopApi;
    readonly debugTelemetryApi: DebugTelemetryApi;
  }
}

export {};
