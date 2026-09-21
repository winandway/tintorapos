import { z } from "zod";
import { fmt, type Idioma } from "@/lib/i18n";

export const TIPOS_AVISO = ["recibida", "lista", "recordatorio"] as const;
export type TipoAviso = (typeof TIPOS_AVISO)[number];

export const PLANTILLAS_BASE: Record<TipoAviso, Record<Idioma, string>> = {
  recibida: {
    es: "{tienda}: Hola {nombre}, recibimos tu orden #{numero}. Estará lista el {fecha}. Consulta el estado: {enlace}",
    en: "{tienda}: Hi {nombre}, we received your order #{numero}. It will be ready {fecha}. Check status: {enlace}",
  },
  lista: {
    es: "{tienda}: ¡Hola {nombre}! Tu orden #{numero} está lista para recoger. {enlace}",
    en: "{tienda}: Hi {nombre}! Your order #{numero} is ready for pickup. {enlace}",
  },
  recordatorio: {
    es: "{tienda}: Hola {nombre}, tu orden #{numero} sigue esperándote. Pasa a recogerla cuando puedas. {enlace}",
    en: "{tienda}: Hi {nombre}, your order #{numero} is still waiting for you. Stop by to pick it up. {enlace}",
  },
};

export const esquemaPlantilla = z.object({
  activo: z.boolean(),
  es: z.string().trim().max(480).optional(),
  en: z.string().trim().max(480).optional(),
});

export const esquemaPlantillas = z.object({
  recibida: esquemaPlantilla.optional(),
  lista: esquemaPlantilla.optional(),
  recordatorio: esquemaPlantilla.optional(),
  /**
   * El recibo digital por correo al crear la orden. Va aparte del aviso
   * «recibida» (que también sale por SMS y por eso nace apagado): el recibo por
   * correo no cuesta y el cliente lo espera, así que nace ENCENDIDO.
   */
  reciboCorreo: z.boolean().optional(),
});

export type Plantillas = z.infer<typeof esquemaPlantillas>;

/** ¿Se manda el recibo digital por correo al crear la orden? De fábrica, sí. */
export function reciboPorCorreo(guardado: string | null | undefined): boolean {
  try {
    return esquemaPlantillas.parse(JSON.parse(guardado || "{}")).reciboCorreo ?? true;
  } catch {
    return true;
  }
}

/** El asunto del correo con el recibo: que se entienda en la bandeja qué es y de quién. */
export function asuntoRecibo(idioma: Idioma, tienda: string, numero: number | string): string {
  return idioma === "en"
    ? `Your receipt · Order #${numero} · ${tienda}`
    : `Tu recibo · Orden #${numero} · ${tienda}`;
}

/** Configuración efectiva: lo que guardó el dueño o, si no, el texto de fábrica. «Recibida» empieza apagado. */
export function configuracionAvisos(guardado: string | null | undefined) {
  let p: Plantillas = {};
  try {
    p = esquemaPlantillas.parse(JSON.parse(guardado || "{}"));
  } catch {
    p = {};
  }
  const salida = {} as Record<TipoAviso, { activo: boolean; es: string; en: string; personalizado: boolean }>;
  for (const tipo of TIPOS_AVISO) {
    const g = p[tipo];
    salida[tipo] = {
      activo: g?.activo ?? tipo !== "recibida",
      es: g?.es || PLANTILLAS_BASE[tipo].es,
      en: g?.en || PLANTILLAS_BASE[tipo].en,
      personalizado: Boolean(g?.es || g?.en),
    };
  }
  return salida;
}

export function componerAviso(
  plantilla: string,
  datos: { tienda: string; nombre: string; numero: number | string; fecha: string; enlace: string },
) {
  return fmt(plantilla, datos).replace(/\s+/g, " ").trim().slice(0, 612);
}
