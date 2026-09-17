import { expect, test } from "@playwright/test";

/**
 * Prueba de humo: las rutas principales tienen que responder 200.
 * Es la red mínima: si algo tumba la app, salta aquí.
 * También se corre contra el sitio publicado con E2E_URL=https://… npm run test:e2e -- humo
 */
export const RUTAS_PUBLICAS = [
  "/",
  "/entrar",
  "/registro",
  "/docs",
  "/docs/primeros-pasos",
  "/es",
  "/en",
  "/es/docs",
  "/en/docs/getting-started",
  "/es/docs/primeros-pasos",
  "/en/privacy",
  "/en/terms",
  "/en/signup",
  "/es/registro",
  "/privacidad",
  "/terminos",
  "/llms.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/.well-known/api-catalog",
  "/.well-known/openapi.json",
  "/.well-known/agent-skills/index.json",
  "/.well-known/mcp/server-card.json",
  "/.well-known/ai-catalog.json",
  "/md",
  "/manifest.webmanifest",
];

for (const ruta of RUTAS_PUBLICAS) {
  test(`responde 200: ${ruta}`, async ({ request }) => {
    const r = await request.get(ruta);
    expect(r.status(), `la ruta ${ruta} respondió ${r.status()}`).toBe(200);
  });
}
