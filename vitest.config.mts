import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const alias = { "@": path.resolve(import.meta.dirname, "src") };

// Umbral estricto para todo lo que toca dinero, sesiones, permisos o datos personales.
const estricto = { lines: 90, statements: 90, functions: 90, branches: 85 };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: false,
    restoreMocks: true,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    projects: [
      {
        extends: true,
        test: {
          name: "servidor",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/integracion/**/*.test.ts"],
          setupFiles: ["tests/setup/msw.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "interfaz",
          environment: "jsdom",
          include: ["tests/ui/**/*.test.tsx"],
          setupFiles: ["tests/setup/dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "json-summary"],
      include: ["src/lib/**", "src/server/**", "src/app/datos/**", "src/app/media/**", "src/components/**"],
      exclude: ["**/*.d.ts", "src/lib/i18n/diccionarios/**"],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 60,
        "src/lib/dinero/**": estricto,
        "src/server/auth/**": estricto,
        "src/server/permisos/**": estricto,
        "src/server/pagos/**": estricto,
        "src/server/caja/**": estricto,
        "src/server/clientes/**": estricto,
        "src/server/ordenes/**": estricto,
        "src/server/respaldos/**": estricto,
      },
    },
  },
});
