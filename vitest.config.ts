import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "__tests__/ui/**/*.test.{ts,tsx}",
      "__tests__/ingest/**/*.test.ts",
      "__tests__/identity/**/*.test.ts",
      "__tests__/mcp/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "server-only": resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
