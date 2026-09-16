/** Valores del sistema (no son de ninguna tintorería): última corrida del reloj, etc. */
export async function leerSistema(
  db: D1Database,
  clave: string,
): Promise<{ valor: string; actualizadoEn: number } | null> {
  const f = await db
    .prepare("select valor, actualizado_en from sistema where clave = ?")
    .bind(clave)
    .first<{ valor: string; actualizado_en: number }>();
  return f ? { valor: f.valor, actualizadoEn: f.actualizado_en } : null;
}

export async function guardarSistema(
  db: D1Database,
  clave: string,
  valor: string,
  ahora = Date.now(),
): Promise<void> {
  await db
    .prepare(
      "insert into sistema (clave, valor, actualizado_en) values (?, ?, ?) on conflict (clave) do update set valor = excluded.valor, actualizado_en = excluded.actualizado_en",
    )
    .bind(clave, valor, ahora)
    .run();
}
