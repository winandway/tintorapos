import type { Variables } from "@/env";
import { limpiarSesionesVencidas } from "@/server/auth/sesiones";
import { procesarCola, programarRecordatorios } from "@/server/avisos";
import { anonimizarClientesVencidos } from "@/server/clientes";
import { limpiarLimitesVencidos } from "@/server/limites";
import { crearRespaldo, limpiarRespaldosViejos, tintoreriasPorRespaldar } from "@/server/respaldos";
import { guardarSistema } from "@/server/sistema";

export interface ResultadoReloj {
  avisos: Awaited<ReturnType<typeof procesarCola>>;
  recordatorios: number;
  respaldos: { hechos: number; fallidos: string[] };
  respaldosBorrados: number;
  clientesAnonimizados: number;
  sesionesBorradas: number;
  limitesBorrados: number;
  duracionMs: number;
}

/**
 * Lo que corre cada 5 minutos, disparado por el reloj externo. Cada tarea va
 * aparte: si una falla, las demás siguen y el fallo queda en /datos/salud.
 */
export async function correrReloj(
  env: CloudflareEnv,
  vars: Variables,
  ahora = Date.now(),
): Promise<ResultadoReloj> {
  const inicio = Date.now();
  const errores: string[] = [];
  const intentar = async <T>(nombre: string, fn: () => Promise<T>, porDefecto: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      errores.push(`${nombre}: ${e instanceof Error ? e.message : String(e)}`);
      console.error(`Reloj — ${nombre} falló:`, e);
      return porDefecto;
    }
  };
  const recordatorios = await intentar(
    "recordatorios",
    () => programarRecordatorios(env.DB, vars.APP_URL, ahora),
    0,
  );
  const avisos = await intentar("avisos", () => procesarCola(env, vars, { limite: 100 }, ahora), {
    enviados: 0,
    fallidos: 0,
    omitidos: 0,
    reintentos: 0,
  });
  const respaldos = { hechos: 0, fallidos: [] as string[] };
  if (vars.BACKUP_KEY) {
    for (const id of await intentar(
      "respaldos",
      () => tintoreriasPorRespaldar(env.DB, ahora),
      [] as string[],
    )) {
      const ok = await intentar(`respaldo ${id}`, () => crearRespaldo(env, vars, id, ahora), null);
      if (ok) respaldos.hechos++;
      else respaldos.fallidos.push(id);
    }
  } else {
    errores.push("respaldos: falta BACKUP_KEY");
  }
  const resultado: ResultadoReloj = {
    avisos,
    recordatorios,
    respaldos,
    respaldosBorrados: await intentar("retención", () => limpiarRespaldosViejos(env, ahora), 0),
    clientesAnonimizados: await intentar("papelera", () => anonimizarClientesVencidos(env.DB, ahora), 0),
    sesionesBorradas: await intentar("sesiones", () => limpiarSesionesVencidas(env.DB, ahora), 0),
    limitesBorrados: await intentar("límites", () => limpiarLimitesVencidos(env.DB, ahora), 0),
    duracionMs: Date.now() - inicio,
  };
  await guardarSistema(env.DB, "reloj_ultima_corrida", JSON.stringify({ ...resultado, errores }), ahora);
  if (respaldos.hechos > 0) await guardarSistema(env.DB, "respaldo_ultimo_ok", String(ahora), ahora);
  return resultado;
}
