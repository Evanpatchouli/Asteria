import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const CSP_PLACEHOLDER = "__ASTERIA_CSP__";
const currentDirectory = dirname(fileURLToPath(import.meta.url));

function createContentSecurityPolicyPlugin(isDevelopment: boolean): Plugin {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self'",
    isDevelopment ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    "img-src 'self' data:",
    isDevelopment
      ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:*"
      : "connect-src 'self'",
  ].join("; ");

  return {
    name: "asteria-content-security-policy",
    transformIndexHtml(html) {
      return html.replace(CSP_PLACEHOLDER, contentSecurityPolicy);
    },
  };
}

export default defineConfig(({ command }) => {
  const isDevelopment = command === "serve";

  return {
    main: {},
    preload: {
      build: {
        externalizeDeps: false,
        rollupOptions: {
          output: {
            format: "cjs",
          },
        },
      },
    },
    renderer: {
      publicDir: resolve(currentDirectory, "../../pets/public"),
      build: {
        rollupOptions: {
          input: isDevelopment
            ? {
                debug: resolve(currentDirectory, "src/renderer/debug.html"),
                index: resolve(currentDirectory, "src/renderer/index.html"),
              }
            : {
                index: resolve(currentDirectory, "src/renderer/index.html"),
              },
        },
      },
      plugins: [createContentSecurityPolicyPlugin(isDevelopment), react()],
    },
  };
});
