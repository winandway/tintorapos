import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  security.configs.recommended,
  {
    rules: {
      // Marca CADA acceso obj[clave] (miles de falsos positivos). Lo cubren
      // TypeScript estricto + noUncheckedIndexedAccess + zod en toda entrada.
      "security/detect-object-injection": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-restricted-syntax": [
        "error",
        {
          // Candado: toda contraseña pasa por <CampoClave> (lleva el ojito).
          selector: "JSXAttribute[name.name='type'][value.value='password']",
          message: "Usa <CampoClave> (componente con ojito) en vez de un input type=password suelto.",
        },
        {
          // Candado: YaDominios Cloud puede capturar /api/* antes que el código.
          selector: "Literal[value=/^\\/api\\//]",
          message: "Prohibido el prefijo /api/: las rutas del backend van en /datos.",
        },
        {
          selector: "TemplateElement[value.raw=/^\\/api\\//]",
          message: "Prohibido el prefijo /api/: las rutas del backend van en /datos.",
        },
      ],
    },
  },
  {
    files: ["src/components/ui/campo-clave.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["tests/**", "scripts/**", "*.config.*", "e2e/**"],
    rules: { "no-console": "off", "security/detect-non-literal-fs-filename": "off" },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    ".open-next/**",
    ".wrangler/**",
    ".dist-worker/**",
    "out-deploy/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    "public/sw.js",
  ]),
]);
