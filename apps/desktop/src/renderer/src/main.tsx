import { PLACEHOLDER_STATE_ACTIONS, PixiPetRenderer } from "@asteria/renderer";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./styles.css";

const petSurface = document.querySelector<HTMLDivElement>("#pet-surface");
const rootElement = document.querySelector<HTMLDivElement>("#root");

if (!petSurface) {
  throw new Error("Pet renderer surface was not found.");
}

if (!rootElement) {
  throw new Error("Renderer root element was not found.");
}

const petRenderer = new PixiPetRenderer({
  host: petSurface,
});
let isPageUnloading = false;

const destroyPetRenderer = (): void => {
  isPageUnloading = true;
  petRenderer.destroy();
};

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    destroyPetRenderer();
  }
});

import.meta.hot?.dispose(destroyPetRenderer);

void petRenderer
  .initialize()
  .then(() => {
    if (!isPageUnloading) {
      petRenderer.play(PLACEHOLDER_STATE_ACTIONS.idle);
    }
  })
  .catch((error: unknown) => {
    if (!isPageUnloading) {
      console.error("Failed to initialize the PixiJS renderer.", error);
    }
  });

createRoot(rootElement).render(<App />);
