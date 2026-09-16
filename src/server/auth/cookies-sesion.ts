import { borrarCookie, COOKIE_DISPOSITIVO, COOKIE_SESION, crearCookie } from "@/server/cookies";
import { DURACION } from "./sesiones";

export function cookieSesion(token: string, tipo: "cuenta" | "pin"): string {
  const max = tipo === "pin" ? DURACION.pinMax : DURACION.cuentaMax;
  return crearCookie(COOKIE_SESION, token, { maxAgeSeg: max / 1000 });
}

export function cookieSalir(): string {
  return borrarCookie(COOKIE_SESION);
}

export function cookieDispositivo(token: string): string {
  return crearCookie(COOKIE_DISPOSITIVO, token, { maxAgeSeg: DURACION.dispositivo / 1000 });
}

export function cookieQuitarDispositivo(): string {
  return borrarCookie(COOKIE_DISPOSITIVO);
}

/** A dónde tiene que ir la persona después de entrar. */
export type Siguiente = "app" | "dos_pasos" | "dos_pasos_activar" | "cambiar_clave";

export function siguientePaso(
  u: { rol: string; totpActivo: boolean; debeCambiarClave: boolean },
  dosPasosOk: boolean,
): Siguiente {
  if (!dosPasosOk && u.rol === "dueno" && !u.totpActivo) return "dos_pasos_activar";
  if (!dosPasosOk && u.totpActivo) return "dos_pasos";
  if (u.debeCambiarClave) return "cambiar_clave";
  return "app";
}
