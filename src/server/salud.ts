import type { Variables } from "@/env";
import { faltantesProduccion } from "@/env";
import { twilioConfigurado } from "@/server/avisos/twilio";
import { correoConfigurado } from "@/server/correo";
import { leerSistema } from "@/server/sistema";

export type EstadoPieza = "ok" | "error" | "no_configurado";

export interface Salud {
  estado: "ok" | "error";
  piezas: Record<string, { estado: EstadoPieza; detalle?: string }>;
  revisadoEn: number;
}

const QUINCE_MIN = 15 * 60_000;
const DIA_Y_MEDIO = 36 * 3600_000;

/**
 * Canario: revisa CADA pieza de la que depende el negocio. Una pieza caída se
 * ve aquí en rojo en vez de fallar en silencio. «no_configurado» no tumba el
 * estado general (se avisa), «error» sí.
 */
export async function revisarSalud(env: CloudflareEnv, vars: Variables, ahora = Date.now()): Promise<Salud> {
  const piezas: Salud["piezas"] = {};
  try {
    const f = await env.DB.prepare(
      "select count(*) as n from sqlite_master where type = 'table' and name in ('ordenes', 'pagos', 'auditoria')",
    ).first<{ n: number }>();
    piezas.base =
      f?.n === 3 ? { estado: "ok" } : { estado: "error", detalle: "faltan tablas: ¿se aplicó schema.sql?" };
  } catch (e) {
    console.error("[salud] base:", e);
    piezas.base = { estado: "error", detalle: "la consulta a la base falló (ver registro de errores)" };
  }
  try {
    const clave = "salud/latido.txt";
    await env.BUCKET.put(clave, String(ahora));
    const leido = await (await env.BUCKET.get(clave))?.text();
    piezas.almacen =
      leido === String(ahora)
        ? { estado: "ok" }
        : { estado: "error", detalle: "lectura distinta a la escritura" };
  } catch (e) {
    console.error("[salud] almacén:", e);
    piezas.almacen = {
      estado: "error",
      detalle: "la escritura en el almacén falló (ver registro de errores)",
    };
  }
  const faltan = faltantesProduccion(vars);
  piezas.variables = faltan.length
    ? { estado: "error", detalle: `faltan: ${faltan.join(", ")}` }
    : { estado: "ok" };
  piezas.correo = correoConfigurado(env, vars)
    ? { estado: "ok" }
    : { estado: "no_configurado", detalle: "EMAIL (dominio propio) y EMAIL_FROM" };
  piezas.sms = twilioConfigurado({
    sid: vars.TWILIO_ACCOUNT_SID,
    token: vars.TWILIO_AUTH_TOKEN,
    desde: vars.TWILIO_FROM,
  })
    ? { estado: "ok" }
    : { estado: "no_configurado", detalle: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_FROM" };
  piezas.turnstile =
    vars.TURNSTILE_SECRET_KEY && vars.TURNSTILE_SITE_KEY
      ? { estado: "ok" }
      : { estado: "no_configurado", detalle: "TURNSTILE_SITE_KEY y TURNSTILE_SECRET_KEY" };

  if (piezas.base.estado === "ok") {
    const reloj = await leerSistema(env.DB, "reloj_ultima_corrida").catch(() => null);
    if (!reloj) piezas.reloj = { estado: "error", detalle: "el reloj externo nunca llamó a /datos/reloj" };
    else if (ahora - reloj.actualizadoEn > QUINCE_MIN)
      piezas.reloj = {
        estado: "error",
        detalle: `última corrida hace ${Math.round((ahora - reloj.actualizadoEn) / 60_000)} min`,
      };
    else {
      const errores = (JSON.parse(reloj.valor) as { errores?: string[] }).errores ?? [];
      piezas.reloj = errores.length
        ? { estado: "error", detalle: errores.join(" | ").slice(0, 300) }
        : { estado: "ok" };
    }
    const hayTiendas = await env.DB.prepare(
      "select count(*) as n from tintorerias /* sistema: salud de respaldos */ where estado = 'activa' and creada_en < ?",
    )
      .bind(ahora - DIA_Y_MEDIO)
      .first<{ n: number }>();
    const respaldo = await leerSistema(env.DB, "respaldo_ultimo_ok").catch(() => null);
    if (!hayTiendas?.n) piezas.respaldos = { estado: "ok", detalle: "sin tintorerías con más de un día" };
    else if (!respaldo || ahora - Number(respaldo.valor) > DIA_Y_MEDIO)
      piezas.respaldos = { estado: "error", detalle: "sin respaldo exitoso en 36 horas" };
    else piezas.respaldos = { estado: "ok" };

    const fallidos = await env.DB.prepare(
      "select count(*) as n from avisos /* sistema: salud de avisos */ where estado = 'fallido' and creado_en > ?",
    )
      .bind(ahora - 86_400_000)
      .first<{ n: number }>();
    piezas.avisos =
      (fallidos?.n ?? 0) > 20
        ? { estado: "error", detalle: `${fallidos?.n} avisos fallidos en 24 h` }
        : { estado: "ok" };
  }
  const estado = Object.values(piezas).some((p) => p.estado === "error") ? "error" : "ok";
  return { estado, piezas, revisadoEn: ahora };
}

/**
 * Lo que ve cualquiera: solo ok / error / no_configurado por pieza. Los motivos
 * (variables que faltan, errores del reloj) pueden delatar la configuración, así
 * que solo salen con «Authorization: Bearer RELOJ_SECRETO».
 */
export function saludPublica(s: Salud): Salud {
  return {
    estado: s.estado,
    revisadoEn: s.revisadoEn,
    piezas: Object.fromEntries(Object.entries(s.piezas).map(([k, p]) => [k, { estado: p.estado }])),
  };
}
