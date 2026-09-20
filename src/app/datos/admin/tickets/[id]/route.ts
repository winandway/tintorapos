import { z } from "zod";
import { cambiarEstadoTicket, responderTicket, verTicket } from "@/server/soporte/tickets";
import { ruta } from "@/server/ruta";
import { exigirAdmin } from "../../_admin";

export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    exigirAdmin(c);
    return { ticket: await verTicket(c.db, c.params.id ?? "") };
  },
});

/** Responder: se guarda y le sale el correo al cliente en su idioma. */
export const POST = ruta({
  acceso: "sesion",
  permitirPruebaVencida: true,
  cuerpo: z.object({ mensaje: z.string().trim().min(2).max(4000) }),
  manejar: async (c) => {
    exigirAdmin(c);
    return responderTicket(
      c.db,
      c.vars,
      c.params.id ?? "",
      c.cuerpo.mensaje,
      c.sesion!.usuario.nombre,
      c.ahora,
    );
  },
});

export const PUT = ruta({
  acceso: "sesion",
  permitirPruebaVencida: true,
  cuerpo: z.object({ estado: z.enum(["abierto", "respondido", "cerrado"]) }),
  manejar: async (c) => {
    exigirAdmin(c);
    await cambiarEstadoTicket(c.db, c.params.id ?? "", c.cuerpo.estado, c.ahora);
    return { ok: true };
  },
});
