import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import { createPetRuntimeComposition } from "./pet-runtime-composition.js";
import "./styles.css";

const petSurface = document.querySelector<HTMLDivElement>("#pet-surface");
const rootElement = document.querySelector<HTMLDivElement>("#root");

if (!petSurface) {
  throw new Error("Pet renderer surface was not found.");
}

if (!rootElement) {
  throw new Error("Renderer root element was not found.");
}

const composition = createPetRuntimeComposition(petSurface);
let isPageUnloading = false;

const destroyPetRuntime = (): void => {
  isPageUnloading = true;
  composition.destroy();
};

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    destroyPetRuntime();
  }
});

import.meta.hot?.dispose(destroyPetRuntime);

void composition.ready.catch((error: unknown) => {
  if (!isPageUnloading) {
    window.debugTelemetryApi.report({
      kind: "log",
      log: {
        detail: {
          en: `Renderer initialization failed: ${formatError(error)}`,
          zh: `渲染器初始化失败：${formatError(error)}`,
        },
        event: "renderer.failed",
        level: "error",
        stage: "renderer",
      },
    });
    console.error("Failed to initialize the Pet Runtime.", error);
  }
});

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

createRoot(rootElement).render(<App />);
