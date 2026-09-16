/**
 * Límite de intentos guardado en la base (la plataforma no tiene KV).
 * Una sola sentencia atómica: cuenta y reinicia la ventana si venció.
 */
export interface ResultadoLimite {
  permitido: boolean;
  conteo: number;
  reiniciaEn: number;
}

export async function limitar(
  db: D1Database,
  clave: string,
  max: number,
  ventanaSeg: number,
  ahora = Date.now(),
): Promise<ResultadoLimite> {
  const fin = ahora + ventanaSeg * 1000;
  const fila = await db
    .prepare(
      `insert into limites (clave, conteo, reinicia_en) values (?, 1, ?)
       on conflict (clave) do update set
         conteo = case when limites.reinicia_en <= ? then 1 else limites.conteo + 1 end,
         reinicia_en = case when limites.reinicia_en <= ? then ? else limites.reinicia_en end
       returning conteo, reinicia_en`,
    )
    .bind(clave, fin, ahora, ahora, fin)
    .first<{ conteo: number; reinicia_en: number }>();
  const conteo = fila?.conteo ?? 1;
  return { permitido: conteo <= max, conteo, reiniciaEn: fila?.reinicia_en ?? fin };
}

/** Borra el contador (por ejemplo, después de entrar bien). */
export async function reiniciarLimite(db: D1Database, clave: string): Promise<void> {
  await db.prepare("delete from limites where clave = ?").bind(clave).run();
}

export async function limpiarLimitesVencidos(db: D1Database, ahora = Date.now()): Promise<number> {
  const r = await db.prepare("delete from limites where reinicia_en <= ?").bind(ahora).run();
  return r.meta.changes ?? 0;
}
