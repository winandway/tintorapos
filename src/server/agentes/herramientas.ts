/**
 * Lo que un agente de IA puede hacer con Tintora POS SIN cuenta: consultar el
 * estado de una orden con el código del recibo, buscar en las guías y saber qué
 * es el producto. Solo lectura y solo datos públicos — los mismos que ya ve
 * cualquiera con el enlace del recibo.
 *
 * Estas mismas herramientas se publican por MCP (`/mcp`) y en el navegador
 * (WebMCP), para que la definición viva en un solo sitio.
 */
import { GUIAS, indiceBuscador, SECCIONES } from "@/lib/docs";
import { buscarGuias } from "@/lib/docs/buscar";
import { SLUG_EN } from "@/lib/docs/slugs";
import { esIdioma, type Idioma } from "@/lib/i18n/idiomas";
import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { urlAbsoluta } from "@/lib/seo";
import { ordenPublica } from "@/server/publico/orden";

export interface Herramienta {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    name: "estado_de_orden",
    title: "Estado de una orden de tintorería",
    description:
      "Consulta el estado de una orden de tintorería con el código del recibo o del QR de la etiqueta (por ejemplo el que aparece en tintorapos.com/t/CODIGO). Devuelve el número de orden, si está recibida, en proceso, lista o entregada, cuántas piezas están listas, la fecha prometida y los datos públicos de la tienda. No devuelve teléfonos ni importes.",
    inputSchema: {
      type: "object",
      properties: {
        codigo: {
          type: "string",
          description: "Código público del recibo o de la etiqueta de la prenda.",
        },
      },
      required: ["codigo"],
      additionalProperties: false,
    },
  },
  {
    name: "buscar_guias",
    title: "Buscar en las guías de Tintora POS",
    description:
      "Busca en la documentación de Tintora POS (cómo recibir ropa, imprimir etiquetas, cobrar, cerrar la caja, trabajar sin internet, avisos por SMS, respaldos y más) y devuelve las guías que responden a la consulta, con su dirección.",
    inputSchema: {
      type: "object",
      properties: {
        consulta: { type: "string", description: "Qué se quiere hacer o entender." },
        idioma: { type: "string", enum: ["es", "en"], description: "Idioma de la respuesta." },
      },
      required: ["consulta"],
      additionalProperties: false,
    },
  },
  {
    name: "sobre_tintora_pos",
    title: "Qué es Tintora POS",
    description:
      "Explica qué es Tintora POS, para quién es, qué incluye, en qué países funciona, cómo empieza la prueba gratis y qué NO hace todavía (no procesa tarjetas: registra los cobros que la tienda ya hizo).",
    inputSchema: {
      type: "object",
      properties: {
        idioma: { type: "string", enum: ["es", "en"], description: "Idioma de la respuesta." },
      },
      additionalProperties: false,
    },
  },
];

const idiomaDe = (v: unknown): Idioma => (esIdioma(v) ? v : "es");

export interface Resultado {
  texto: string;
  datos?: unknown;
  error?: boolean;
}

export async function ejecutarHerramienta(
  db: D1Database,
  nombre: string,
  argumentos: Record<string, unknown>,
): Promise<Resultado> {
  switch (nombre) {
    case "estado_de_orden":
      return estadoDeOrden(db, String(argumentos.codigo ?? ""));
    case "buscar_guias":
      return buscar(String(argumentos.consulta ?? ""), idiomaDe(argumentos.idioma));
    case "sobre_tintora_pos":
      return sobreElProducto(idiomaDe(argumentos.idioma));
    default:
      return { texto: `No existe la herramienta «${nombre}».`, error: true };
  }
}

const ESTADOS: Record<string, { es: string; en: string }> = {
  recibida: { es: "recibida", en: "received" },
  en_proceso: { es: "en proceso", en: "in progress" },
  lista: { es: "lista para recoger", en: "ready for pickup" },
  entregada: { es: "entregada", en: "picked up" },
  anulada: { es: "anulada", en: "cancelled" },
  abandonada: { es: "abandonada", en: "abandoned" },
};

async function estadoDeOrden(db: D1Database, codigo: string): Promise<Resultado> {
  const orden = await ordenPublica(db, codigo.trim());
  if (!orden)
    return {
      texto:
        "No hay ninguna orden con ese código. Revisa el código del recibo o el QR de la etiqueta. / No order found with that code.",
      error: true,
    };
  const estado = ESTADOS[orden.estado] ?? { es: orden.estado, en: orden.estado };
  const fecha = new Date(orden.fechaPromesa).toISOString();
  return {
    texto: [
      `Orden #${orden.numero} de ${orden.tienda.nombre}: ${estado.es} (${estado.en}).`,
      `Piezas listas: ${orden.listas} de ${orden.piezas}.`,
      `Lista para / ready by: ${fecha}.`,
      orden.tieneSaldo
        ? "Queda saldo por pagar al recoger. / Balance due at pickup."
        : "Está pagada. / Fully paid.",
    ].join(" "),
    datos: {
      numero: orden.numero,
      estado: orden.estado,
      piezas: orden.piezas,
      piezasListas: orden.listas,
      fechaPromesa: fecha,
      tieneSaldo: orden.tieneSaldo,
      tienda: orden.tienda,
    },
  };
}

function buscar(consulta: string, idioma: Idioma): Resultado {
  const encontradas = buscarGuias(indiceBuscador(idioma), consulta, 6);
  if (encontradas.length === 0)
    return {
      texto:
        idioma === "en"
          ? `No guides matched. The full documentation index is at ${urlAbsoluta("/docs", "en")}.`
          : `No encontramos guías para eso. El índice completo está en ${urlAbsoluta("/docs", "es")}.`,
    };
  const lista = encontradas.map((g) => ({
    titulo: g.titulo,
    resumen: g.resumen,
    seccion: g.seccion,
    url: `${urlAbsoluta(g.href.replace(/^\/(es|en)/, ""), idioma)}`,
  }));
  return {
    texto: lista.map((g) => `- ${g.titulo}: ${g.resumen} (${g.url})`).join("\n"),
    datos: { guias: lista },
  };
}

function sobreElProducto(idioma: Idioma): Resultado {
  const c = CONTENIDO_INICIO[idioma];
  const secciones = SECCIONES.map((s) => (idioma === "en" ? s.en : s.es)).join(", ");
  const texto = [
    `Tintora POS — ${c.meta.descripcion}`,
    idioma === "en"
      ? "Cloud point of sale for dry cleaners, laundries and laundromats in the United States and Latin America. Bilingual English/Spanish."
      : "Punto de venta en la nube para tintorerías, lavanderías y lavamáticos de Estados Unidos y Latinoamérica. Bilingüe español/inglés.",
    idioma === "en"
      ? "It records payments the store already took (cash, its own card terminal, other). It does NOT process cards itself."
      : "Registra los pagos que la tienda ya cobró (efectivo, su propia terminal de tarjeta, otro). NO procesa tarjetas.",
    idioma === "en"
      ? `Free trial (14 days, no credit card): ${urlAbsoluta("/registro", "en")}`
      : `Prueba gratis (14 días, sin tarjeta): ${urlAbsoluta("/registro", "es")}`,
    idioma === "en"
      ? `Documentation (${GUIAS.length} guides: ${secciones}): ${urlAbsoluta("/docs", "en")}`
      : `Documentación (${GUIAS.length} guías: ${secciones}): ${urlAbsoluta("/docs", "es")}`,
  ].join("\n");
  return {
    texto,
    datos: {
      nombre: "Tintora POS",
      idiomas: ["es", "en"],
      guias: GUIAS.length,
      slugsEnIngles: Object.values(SLUG_EN).length,
      procesaTarjetas: false,
      registro: urlAbsoluta("/registro", idioma),
      docs: urlAbsoluta("/docs", idioma),
    },
  };
}
