import { esquemaFalloCliente, guardarFalloCliente } from "@/server/diagnostico";
import { ruta } from "@/server/ruta";

/**
 * Parte de fallo que manda un teléfono cuando un cambio no llegó o el servidor
 * lo rechazó. Público y sin CSRF a propósito: sale por `sendBeacon`, que no
 * lleva cabeceras, y tiene que poder salir justo cuando el camino normal falla.
 * No guarda nada personal (ver src/server/diagnostico.ts) y tiene tope por IP.
 */
export const POST = ruta({
  acceso: "publico",
  csrf: false,
  cuerpo: esquemaFalloCliente,
  limite: { clave: (c) => `diagnostico:${c.ipHash}`, max: 30, ventanaSeg: 60 },
  manejar: async (c) => {
    await guardarFalloCliente(c.db, c.cuerpo, c.ahora);
    return { ok: true };
  },
});
