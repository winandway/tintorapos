import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { siguientePaso } from "@/server/auth/cookies-sesion";
import {
  leerDispositivo,
  leerSesion,
  necesitaDosPasos,
  type DispositivoLeido,
  type Sesion,
} from "@/server/auth/sesiones";
import { COOKIE_DISPOSITIVO, COOKIE_SESION } from "@/server/cookies";
import { obtenerContexto } from "@/server/entorno";
import { type Permiso, usuarioPuede } from "@/server/permisos";

export interface ContextoPagina {
  env: CloudflareEnv;
  db: D1Database;
  vars: ReturnType<typeof obtenerContexto>["vars"];
  sesion: Sesion | null;
  dispositivo: DispositivoLeido | null;
}

export async function contextoPagina(): Promise<ContextoPagina> {
  const { env, vars } = obtenerContexto();
  const galletas = await cookies();
  const [sesion, dispositivo] = await Promise.all([
    leerSesion(env.DB, galletas.get(COOKIE_SESION)?.value),
    leerDispositivo(env.DB, galletas.get(COOKIE_DISPOSITIVO)?.value),
  ]);
  return { env, db: env.DB, vars, sesion, dispositivo };
}

export const RUTA_SIGUIENTE = {
  app: "/app",
  dos_pasos: "/entrar/dos-pasos",
  dos_pasos_activar: "/entrar/activar-dos-pasos",
  cambiar_clave: "/entrar/cambiar-clave",
} as const;

/** Para las páginas de la app: sesión completa o redirección al paso que falte. */
export async function exigirSesion(permiso?: Permiso): Promise<ContextoPagina & { sesion: Sesion }> {
  const c = await contextoPagina();
  if (!c.sesion) redirect(c.dispositivo ? "/app/pin" : "/entrar");
  const paso = siguientePaso(c.sesion.usuario, !necesitaDosPasos(c.sesion) || c.sesion.segundoFactorOk);
  if (paso !== "app") redirect(RUTA_SIGUIENTE[paso]);
  if (permiso && !usuarioPuede(c.sesion.usuario, permiso)) redirect("/app?sin-permiso=1");
  return c as ContextoPagina & { sesion: Sesion };
}

/** Días de prueba gratis que quedan (null si la tintorería no está en prueba). */
export function diasDePrueba(t: Sesion["tintoreria"], ahora = Date.now()): number | null {
  if (t.plan !== "prueba" || !t.pruebaHasta) return null;
  return Math.ceil((t.pruebaHasta - ahora) / 86_400_000);
}
