import { z } from "zod";

/**
 * Variables de entorno validadas. En producción viven en
 * YaDominios Cloud → tu sitio → Variables de entorno.
 * Si falta una obligatoria, la app responde con error claro y /datos/salud lo marca.
 */
const opcional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

export const esquemaEnv = z.object({
  APP_SECRET: z.string().min(32, "APP_SECRET debe tener al menos 32 caracteres"),
  APP_URL: z
    .url("APP_URL debe ser una dirección completa, con https://")
    .transform((u) => u.replace(/\/$/, "")),
  RELOJ_SECRETO: opcional,
  BACKUP_KEY: opcional.refine(
    (v) => v === undefined || Buffer.from(v, "base64").length === 32,
    "BACKUP_KEY debe ser 32 bytes en base64 (openssl rand -base64 32)",
  ),
  TURNSTILE_SITE_KEY: opcional,
  TURNSTILE_SECRET_KEY: opcional,
  TWILIO_ACCOUNT_SID: opcional,
  TWILIO_AUTH_TOKEN: opcional,
  TWILIO_FROM: opcional,
  EMAIL_FROM: opcional,
  /** Correo de contacto que se publica en privacidad y términos. */
  SUPPORT_EMAIL: opcional.refine(
    (v) => v === undefined || z.email().safeParse(v).success,
    "SUPPORT_EMAIL debe ser un correo",
  ),
});

export type Variables = z.infer<typeof esquemaEnv>;

export type ResultadoEnv = { ok: true; datos: Variables } | { ok: false; errores: string[] };

export function validarEnv(fuente: Record<string, unknown>): ResultadoEnv {
  const r = esquemaEnv.safeParse(fuente);
  if (r.success) return { ok: true, datos: r.data };
  return { ok: false, errores: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
}

/** Qué variables obligatorias en PRODUCCIÓN faltan (no bloquean el arranque local). */
export function faltantesProduccion(v: Variables): string[] {
  const faltan: string[] = [];
  if (!v.RELOJ_SECRETO) faltan.push("RELOJ_SECRETO");
  if (!v.BACKUP_KEY) faltan.push("BACKUP_KEY");
  if (!v.APP_URL.startsWith("https://")) faltan.push("APP_URL (debe empezar por https://)");
  return faltan;
}
