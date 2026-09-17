import { z } from "zod";
import { crearEnlaceDispositivo, ENLACE_DISPOSITIVO_MIN } from "@/server/dispositivos";
import { ruta } from "@/server/ruta";

/**
 * Crea el enlace de un solo uso para conectar un celular: en la tablet se
 * muestra como QR, el celular lo escanea con su cámara y queda listo para
 * trabajar con su PIN. Dura pocos minutos y sirve una sola vez.
 */
export const POST = ruta({
  acceso: "cuenta",
  permiso: "dispositivos.gestionar",
  cuerpo: z.object({ nombre: z.string().trim().min(1).max(60) }),
  limite: { clave: (c) => `enlace-disp:${c.sesion?.tintoreria.id}`, max: 20, ventanaSeg: 600 },
  manejar: async (c) => {
    const { token, expiraEn } = await crearEnlaceDispositivo(c.db, c.sesion!, c.cuerpo.nombre, c.ahora);
    // El QR apunta al MISMO sitio desde el que se está mirando la pantalla:
    // así funciona igual en la computadora de la tienda y en el dominio propio.
    const base = new URL(c.req.url).origin;
    return { url: `${base}/v/${token}`, expiraEn, minutos: ENLACE_DISPOSITIVO_MIN };
  },
});
