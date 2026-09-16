import { afterAll, afterEach, beforeAll } from "vitest";
import { servidorMsw } from "../ayuda/msw";

// Ninguna prueba le pega a un servicio real: lo que no esté simulado REVIENTA.
// Solo se deja pasar localhost (Miniflare habla con su motor local por HTTP).
beforeAll(() =>
  servidorMsw.listen({
    onUnhandledRequest(req, print) {
      const { hostname } = new URL(req.url);
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return;
      print.error();
      throw new Error(`Prueba intentó salir a un servicio real sin simular: ${req.method} ${req.url}`);
    },
  }),
);
afterEach(() => servidorMsw.resetHandlers());
afterAll(() => servidorMsw.close());
