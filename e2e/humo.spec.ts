import { expect, test } from "@playwright/test";

/**
 * Prueba de humo: las rutas principales tienen que responder 200.
 * Es la red mínima: si algo tumba la app, salta aquí.
 * También se corre contra el sitio publicado con E2E_URL=https://… npm run test:e2e -- humo
 */
export const RUTAS_PUBLICAS = ["/"];

for (const ruta of RUTAS_PUBLICAS) {
  test(`responde 200: ${ruta}`, async ({ request }) => {
    const r = await request.get(ruta);
    expect(r.status(), `la ruta ${ruta} respondió ${r.status()}`).toBe(200);
  });
}
