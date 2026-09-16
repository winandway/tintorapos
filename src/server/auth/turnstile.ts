/**
 * Escudo anti-robots (Cloudflare Turnstile), comprobado en el SERVIDOR antes de
 * mirar la contraseña.
 * - Sin claves configuradas: se apaga solo (el login funciona igual).
 * - Si Cloudflare no responde: se deja pasar (detrás siguen la clave y el límite de intentos).
 */
export type ResultadoTurnstile = "ok" | "apagado" | "sin_respuesta" | "rechazado";

export async function verificarTurnstile(
  secreto: string | undefined,
  token: string | null,
  ip: string | null,
): Promise<ResultadoTurnstile> {
  if (!secreto) return "apagado";
  if (!token) return "rechazado";
  const cuerpo = new URLSearchParams({ secret: secreto, response: token });
  if (ip) cuerpo.set("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return "sin_respuesta";
    const datos = (await r.json()) as { success?: boolean };
    return datos.success ? "ok" : "rechazado";
  } catch {
    return "sin_respuesta";
  }
}
