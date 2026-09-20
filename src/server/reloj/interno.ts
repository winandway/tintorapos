/**
 * El reloj, sin depender de nadie.
 *
 * YaDominios Cloud no tiene tareas programadas y el Cron externo necesitaba que
 * alguien lo creara en otra cuenta: mientras tanto, NO salían los avisos ni se
 * guardaban los respaldos. Ahora el propio tráfico del sitio mueve el reloj: en
 * cada página se mira si pasaron los minutos y, si toca, la corrida se hace
 * DESPUÉS de responder (`waitUntil`), así nadie espera por ella.
 *
 * El turno se toma con una sola sentencia atómica: si dos visitas coinciden,
 * solo una corre. El Vigilante de la plataforma pide la portada cada 5 minutos,
 * así que el reloj late aunque la tienda esté cerrada.
 */
import { variablesDe, obtenerContexto } from "@/server/entorno";
import { correrReloj } from "@/server/reloj";

export const CLAVE_TURNO = "reloj_turno";
/** Cada cuánto, como mucho, corre el reloj. */
export const MINUTOS_RELOJ = 5;

/**
 * Toma el turno si nadie lo tomó en los últimos minutos. Devuelve false si otro
 * se le adelantó (o si la base falla: entonces no se corre nada).
 */
export async function tomarTurno(db: D1Database, ahora: number): Promise<boolean> {
  const limite = ahora - MINUTOS_RELOJ * 60_000;
  try {
    const r = await db
      .prepare(
        `insert into sistema (clave, valor, actualizado_en) values (?, ?, ?)
         on conflict (clave) do update set valor = excluded.valor, actualizado_en = excluded.actualizado_en
         where sistema.actualizado_en <= ?`,
      )
      .bind(CLAVE_TURNO, String(ahora), ahora, limite)
      .run();
    return (r.meta.changes ?? 0) > 0;
  } catch (e) {
    console.error("[reloj interno] no se pudo tomar el turno:", e);
    return false;
  }
}

/**
 * Se llama en cada página. No lanza nunca: si algo falla, la página se ve igual.
 */
export function latirReloj(): void {
  let contexto;
  try {
    contexto = obtenerContexto();
  } catch {
    return; // Fuera del servidor de la plataforma (pruebas de interfaz, build).
  }
  const { env, esperarLuego } = contexto;
  const ahora = Date.now();
  esperarLuego(
    (async () => {
      if (!(await tomarTurno(env.DB, ahora))) return;
      try {
        await correrReloj(env, variablesDe(env), ahora);
      } catch (e) {
        console.error("[reloj interno] la corrida falló:", e);
      }
    })(),
  );
}
