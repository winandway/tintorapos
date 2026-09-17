/**
 * Cabeceras de seguridad de todo el sitio.
 * Se prueban en tests/unit/cabeceras-seguridad.test.ts: si alguien quita una,
 * la prueba se pone en rojo.
 */
export interface Cabecera {
  key: string;
  value: string;
}

const TURNSTILE = "https://challenges.cloudflare.com";
/**
 * Medición de visitas de Cloudflare (Web Analytics, sin cookies) que la plataforma
 * inyecta en cada página. Sin esto la política la bloquea y ensucia la consola.
 */
const ANALITICA_SCRIPT = "https://static.cloudflareinsights.com";
const ANALITICA_ENVIO = "https://cloudflareinsights.com";

export function politicaContenido(desarrollo: boolean): string {
  const directivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js inyecta scripts en línea para hidratar; sin nonce hace falta 'unsafe-inline'.
    // 'unsafe-eval' solo en desarrollo (recarga en caliente).
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      TURNSTILE,
      ANALITICA_SCRIPT,
      ...(desarrollo ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ANALITICA_ENVIO, ...(desarrollo ? ["ws:", "wss:"] : [])],
    "frame-src": [TURNSTILE],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const partes = Object.entries(directivas).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!desarrollo) partes.push("upgrade-insecure-requests");
  return partes.join("; ");
}

export function cabecerasSeguridad(desarrollo: boolean): Cabecera[] {
  return [
    { key: "Content-Security-Policy", value: politicaContenido(desarrollo) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      // La cámara se usa para escanear etiquetas y fotografiar prendas.
      value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(self), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
