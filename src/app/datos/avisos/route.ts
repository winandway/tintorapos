import { configuracionAvisos, reciboPorCorreo } from "@/server/avisos/plantillas";
import { twilioConfigurado } from "@/server/avisos/twilio";
import { correoConfigurado } from "@/server/correo";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ajustes.avisos",
  manejar: async (c) => {
    const t = c.sesion!.tintoreria.id;
    const [conf, lista] = await c.db.batch([
      c.db.prepare("select plantillas from tintorerias where id = ?").bind(t),
      c.db
        .prepare(
          `select a.id, a.tipo, a.canal, a.destino, a.estado, a.error, a.creado_en, a.enviado_en, o.numero
           from avisos a left join ordenes o on o.id = a.orden_id and o.tintoreria_id = a.tintoreria_id
           where a.tintoreria_id = ? order by a.creado_en desc limit 50`,
        )
        .bind(t),
    ]);
    const plantillas = (conf?.results?.[0] as { plantillas?: string } | undefined)?.plantillas;
    return {
      canales: {
        sms: twilioConfigurado({
          sid: c.vars.TWILIO_ACCOUNT_SID,
          token: c.vars.TWILIO_AUTH_TOKEN,
          desde: c.vars.TWILIO_FROM,
        }),
        correo: correoConfigurado(c.vars),
      },
      plantillas: configuracionAvisos(plantillas),
      reciboCorreo: reciboPorCorreo(plantillas),
      avisos: lista?.results ?? [],
    };
  },
});
