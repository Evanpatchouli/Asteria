import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import type { Plugin } from "vite";

const CSP_PLACEHOLDER = "__ASTERIA_CSP__";

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
      plugins: [
        createContentSecurityPolicyPlugin(command === "serve"),
        react(),
      ],
    },
  };
});
