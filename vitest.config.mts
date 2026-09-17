import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const alias = { "@": path.resolve(import.meta.dirname, "src") };

/**
 * Las pruebas que levantan el servidor real (integración y pantallas) montan su
 * propio miniflare. Corriendo varios archivos a la vez, una máquina cargada (la
 * de GitHub) devuelve «poisoned stub» o corta la conexión y la prueba falla sin
 * que nada esté roto. En CI van de a un archivo por vez, con un reintento.
 */
const enCI = Boolean(process.env.CI);

// Umbral estricto para todo lo que toca dinero, sesiones, permisos o datos personales.
const estricto = { lines: 90, statements: 90, functions: 90, branches: 85 };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: false,
    restoreMocks: true,
    fileParallelism: !enCI,
    retry: enCI ? 1 : 0,
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
      {
        extends: true,
        test: {
          // Pantallas completas contra las rutas /datos reales y la base local de pruebas.
          name: "pantallas",
          environment: "node",
          include: ["tests/pantallas/**/*.test.tsx"],
          setupFiles: ["tests/setup/dom-nodo.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "json-summary", "json"],
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
