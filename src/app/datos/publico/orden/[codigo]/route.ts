import { z } from "zod";
import { ordenPublica } from "@/server/publico/orden";
import { ruta } from "@/server/ruta";

/**
 * Estado de una orden con el código del recibo. Público a propósito (es el mismo
 * dato que ve quien tiene el enlace del recibo) y sin nada personal: ni teléfono,
 * ni dirección del cliente, ni importes.
 */
export const GET = ruta({
  acceso: "publico",
  csrf: false,
  limite: { clave: (c) => `publico-orden:${c.ipHash}`, max: 60, ventanaSeg: 600 },
  manejar: async (c) => {
    const codigo = z
      .string()
      .min(6)
      .max(40)
      .parse(c.params.codigo ?? "");
    const orden = await ordenPublica(c.db, codigo);
    if (!orden) return new Response(null, { status: 404 });
    return Response.json(
      { orden },
      {
        headers: {
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      },
    );
  },
});
