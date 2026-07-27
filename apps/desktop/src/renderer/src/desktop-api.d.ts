import type { DesktopApi } from "@asteria/shared";

declare global {
  interface Window {
    readonly desktopApi: DesktopApi;
  }
}

export {};
