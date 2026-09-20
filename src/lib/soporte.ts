/**
 * A dónde llegan los billetes de soporte y quién entra al panel de Windoce.
 *
 * Van con valor por defecto EN CÓDIGO (no son secretos) para que el soporte
 * funcione desde el primer día sin que nadie toque el panel. Las variables
 * `SUPPORT_EMAIL` y `CORREOS_ADMIN` los cambian cuando haga falta.
 */
export const CORREO_SOPORTE_POR_DEFECTO = "go@windoce.com";

export function correoSoporte(vars: { SUPPORT_EMAIL?: string }): string {
  return vars.SUPPORT_EMAIL ?? CORREO_SOPORTE_POR_DEFECTO;
}

export function correosAdmin(vars: { CORREOS_ADMIN?: string; SUPPORT_EMAIL?: string }): string[] {
  const lista = (vars.CORREOS_ADMIN ?? CORREO_SOPORTE_POR_DEFECTO)
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.includes("@"));
  return lista.length ? lista : [CORREO_SOPORTE_POR_DEFECTO];
}

/** Solo una cuenta con correo de la lista entra al panel de Windoce. */
export function esAdmin(vars: { CORREOS_ADMIN?: string; SUPPORT_EMAIL?: string }, correo?: string | null) {
  return Boolean(correo) && correosAdmin(vars).includes(correo!.toLowerCase());
}
