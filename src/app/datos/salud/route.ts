import { revisarSalud } from "@/server/salud";
import { ruta } from "@/server/ruta";

/** Canario público: 200 si todo lo crítico funciona, 503 si algo está en rojo. No expone secretos. */
export const GET = ruta({
  acceso: "publico",
  limite: { clave: (c) => `salud:${c.ipHash}`, max: 60, ventanaSeg: 60 },
  manejar: async (c) => {
    const s = await revisarSalud(c.env, c.vars, c.ahora);
    return Response.json(s, {
      status: s.estado === "ok" ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  },
});
