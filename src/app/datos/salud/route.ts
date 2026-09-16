import { igualesSeguro } from "@/lib/codigos";
import { revisarSalud, saludPublica } from "@/server/salud";
import { ruta } from "@/server/ruta";

/**
 * Canario: 200 si todo lo crítico funciona, 503 si algo está en rojo.
 * Público solo con estados; el detalle pide «Authorization: Bearer RELOJ_SECRETO».
 */
export const GET = ruta({
  acceso: "publico",
  limite: { clave: (c) => `salud:${c.ipHash}`, max: 60, ventanaSeg: 60 },
  manejar: async (c) => {
    const s = await revisarSalud(c.env, c.vars, c.ahora);
    const auth = c.req.headers.get("authorization") ?? "";
    const detallado = Boolean(c.vars.RELOJ_SECRETO) && igualesSeguro(auth, `Bearer ${c.vars.RELOJ_SECRETO}`);
    return Response.json(detallado ? s : saludPublica(s), {
      status: s.estado === "ok" ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  },
});
