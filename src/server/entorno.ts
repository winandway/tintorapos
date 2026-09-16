import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validarEnv, type Variables } from "@/env";

/** Lo que el código del servidor necesita de la plataforma en cada petición. */
export interface Contexto {
  env: CloudflareEnv;
  vars: Variables;
  /** Trabajo que sigue después de responder (enviar avisos, etc.). */
  esperarLuego: (p: Promise<unknown>) => void;
}

export class ErrorConfiguracion extends Error {
  constructor(public errores: string[]) {
    super(`Configuración inválida: ${errores.join("; ")}`);
  }
}

const cache = new WeakMap<object, Variables>();

export function variablesDe(env: CloudflareEnv): Variables {
  const guardadas = cache.get(env);
  if (guardadas) return guardadas;
  const r = validarEnv(env as unknown as Record<string, unknown>);
  if (!r.ok) throw new ErrorConfiguracion(r.errores);
  cache.set(env, r.datos);
  return r.datos;
}

export function obtenerContexto(): Contexto {
  const { env, ctx } = getCloudflareContext();
  return {
    env,
    vars: variablesDe(env),
    esperarLuego: (p) =>
      ctx.waitUntil(
        p.catch((e: unknown) => {
          console.error("Tarea en segundo plano falló:", e);
        }),
      ),
  };
}
