import { createRoot } from "react-dom/client";

import { DebugApp } from "./App.js";
import "./styles.css";

const rootElement = document.querySelector<HTMLDivElement>("#debug-root");

if (!rootElement) {
  throw new Error("Debug Renderer root element was not found.");
}

createRoot(rootElement).render(<DebugApp />);
