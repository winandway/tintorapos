import { z } from "zod";
import { cookieDispositivo } from "@/server/auth/cookies-sesion";
import { listarDispositivos, registrarDispositivo } from "@/server/dispositivos";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "dispositivos.gestionar",
  manejar: async (c) => ({ dispositivos: await listarDispositivos(c.db, c.sesion!.tintoreria.id) }),
});

/** Registra ESTE navegador como dispositivo de la tienda (tablet del mostrador, celular de planta). */
export const POST = ruta({
  acceso: "cuenta",
  permiso: "dispositivos.gestionar",
  cuerpo: z.object({ nombre: z.string().trim().min(1).max(60) }),
  manejar: async (c) => {
    const d = await registrarDispositivo(
      c.db,
      c.sesion!,
      c.cuerpo.nombre,
      c.req.headers.get("user-agent"),
      c.ahora,
    );
    c.ponerCookie(cookieDispositivo(d.token));
    return { ok: true, id: d.id };
  },
});
