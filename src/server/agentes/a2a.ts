/**
 * Puerta A2A (Agent2Agent): otro agente manda un mensaje en texto y Tintora POS
 * responde con lo que sabe en público. Por dentro usa las MISMAS herramientas
 * que el servidor MCP, así nunca hay dos verdades.
 */
import { nuevoId } from "@/lib/codigos";
import { ejecutarHerramienta } from "./herramientas";

export const VERSION_A2A = "0.3.0";

interface Parte {
  kind?: string;
  text?: string;
}
interface Mensaje {
  role?: string;
  parts?: Parte[];
  messageId?: string;
  contextId?: string;
}

const textoDe = (m: Mensaje | undefined): string =>
  (m?.parts ?? [])
    .filter((p) => (p.kind ?? "text") === "text")
    .map((p) => p.text ?? "")
    .join(" ")
    .trim();

/**
 * Un código de recibo es largo y casi siempre trae números. Se busca el más
 * largo del mensaje: así «el código del recibo es …» no confunde la palabra
 * «RECIBO» con el código (pasó, y la prueba lo fija).
 */
const CANDIDATOS = /[A-Z0-9]{8,40}/g;

function codigoDelTexto(texto: string): string | undefined {
  const posibles = texto.toUpperCase().match(CANDIDATOS) ?? [];
  const mejor = posibles.sort((a, b) => b.length - a.length)[0];
  if (!mejor) return undefined;
  return /\d/.test(mejor) || mejor.length >= 12 ? mejor : undefined;
}

/** Qué herramienta responde mejor a lo que escribió el otro agente. */
export function elegirHerramienta(texto: string): { nombre: string; argumentos: Record<string, unknown> } {
  const limpio = texto.trim();
  const codigo = codigoDelTexto(limpio);
  const idioma = /\b(the|what|how|my|is|order|laundry|dry)\b/i.test(limpio) ? "en" : "es";
  if (codigo && /(orden|order|recibo|receipt|ropa|laundry|lista|ready|estado|status)/i.test(limpio))
    return { nombre: "estado_de_orden", argumentos: { codigo } };
  if (codigo && limpio.split(/\s+/).length <= 3) return { nombre: "estado_de_orden", argumentos: { codigo } };
  if (/(qu[eé] es|what is|qui[eé]n|who|precio|price|cu[aá]nto|cost|prueba|trial)/i.test(limpio))
    return { nombre: "sobre_tintora_pos", argumentos: { idioma } };
  return { nombre: "buscar_guias", argumentos: { consulta: limpio, idioma } };
}

const respuesta = (id: unknown, result: unknown) => ({ jsonrpc: "2.0" as const, id: id ?? null, result });
const fallo = (id: unknown, code: number, message: string) => ({
  jsonrpc: "2.0" as const,
  id: id ?? null,
  error: { code, message },
});

export async function manejarA2a(db: D1Database, cuerpo: unknown): Promise<object> {
  const p = (cuerpo ?? {}) as {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: Record<string, unknown>;
  };
  if (p.jsonrpc !== "2.0" || typeof p.method !== "string")
    return fallo(p.id, -32600, "Petición JSON-RPC inválida.");

  if (p.method === "message/send") {
    const mensaje = p.params?.message as Mensaje | undefined;
    const texto = textoDe(mensaje);
    if (!texto) return fallo(p.id, -32602, "El mensaje no trae texto.");
    const { nombre, argumentos } = elegirHerramienta(texto);
    const r = await ejecutarHerramienta(db, nombre, argumentos);
    return respuesta(p.id, {
      kind: "message",
      role: "agent",
      messageId: nuevoId(),
      ...(mensaje?.contextId ? { contextId: mensaje.contextId } : {}),
      parts: [{ kind: "text", text: r.texto }],
      metadata: { herramienta: nombre },
    });
  }
  if (p.method === "message/stream")
    return fallo(p.id, -32004, "Esta puerta no manda respuestas en streaming; usa message/send.");
  if (p.method.startsWith("tasks/"))
    return fallo(p.id, -32003, "Cada mensaje se responde en el acto: no hay tareas que consultar.");
  return fallo(p.id, -32601, `Método no disponible: ${p.method}.`);
}
