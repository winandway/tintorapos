"use client";

import { useEffect } from "react";

/**
 * WebMCP: le ofrece al agente del navegador las mismas herramientas públicas
 * que el servidor MCP (estado de una orden, búsqueda en las guías y qué es el
 * producto). Si el navegador no lo soporta, no pasa nada.
 */
interface HerramientaWeb {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (entrada: Record<string, unknown>) => Promise<{ content: { type: "text"; text: string }[] }>;
}

interface ContextoModelo {
  registerTool?: (h: HerramientaWeb, opciones?: { signal?: AbortSignal }) => unknown;
  provideContext?: (c: { tools: HerramientaWeb[] }) => unknown;
}

const texto = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

async function pedirJson(ruta: string): Promise<unknown> {
  const r = await fetch(ruta, { headers: { accept: "application/json" } });
  if (!r.ok) return null;
  return r.json();
}

export function HerramientasAgente() {
  useEffect(() => {
    const contexto = (navigator as Navigator & { modelContext?: ContextoModelo }).modelContext;
    if (!contexto) return;
    const corte = new AbortController();

    const herramientas: HerramientaWeb[] = [
      {
        name: "estado_de_orden",
        description:
          "Consulta el estado de una orden de tintorería con el código del recibo o del QR de la etiqueta. Check a dry cleaning order status from its receipt code.",
        inputSchema: {
          type: "object",
          properties: { codigo: { type: "string", description: "Código del recibo." } },
          required: ["codigo"],
        },
        execute: async ({ codigo }) => {
          const datos = (await pedirJson(
            `/datos/publico/orden/${encodeURIComponent(String(codigo ?? ""))}`,
          )) as {
            orden?: { numero: number; estado: string; piezas: number; listas: number; tieneSaldo: boolean };
          } | null;
          if (!datos?.orden) return texto("No hay ninguna orden con ese código. / No order with that code.");
          const o = datos.orden;
          return texto(
            `Orden #${o.numero}: ${o.estado}. Piezas listas: ${o.listas} de ${o.piezas}. ${o.tieneSaldo ? "Queda saldo por pagar." : "Está pagada."}`,
          );
        },
      },
      {
        name: "buscar_guias",
        description:
          "Busca en las guías de Tintora POS cómo hacer algo (recibir ropa, etiquetas, caja, reportes, avisos). Search the Tintora POS documentation.",
        inputSchema: {
          type: "object",
          properties: { consulta: { type: "string", description: "Qué se quiere hacer." } },
          required: ["consulta"],
        },
        execute: async ({ consulta }) => {
          const r = await fetch("/mcp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: { name: "buscar_guias", arguments: { consulta: String(consulta ?? "") } },
            }),
          });
          const j = (await r.json()) as { result?: { content?: { text?: string }[] } };
          return texto(j.result?.content?.[0]?.text ?? "No encontramos guías para eso.");
        },
      },
      {
        name: "sobre_tintora_pos",
        description:
          "Qué es Tintora POS, qué incluye, qué no hace y cómo empieza la prueba gratis. What Tintora POS is and does.",
        inputSchema: { type: "object", properties: {} },
        execute: async () => {
          const r = await fetch("/mcp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: { name: "sobre_tintora_pos", arguments: {} },
            }),
          });
          const j = (await r.json()) as { result?: { content?: { text?: string }[] } };
          return texto(j.result?.content?.[0]?.text ?? "Tintora POS: punto de venta para tintorerías.");
        },
      },
    ];

    try {
      if (typeof contexto.registerTool === "function")
        for (const h of herramientas) contexto.registerTool(h, { signal: corte.signal });
      else contexto.provideContext?.({ tools: herramientas });
    } catch (e) {
      console.error("[webmcp] no se pudieron publicar las herramientas:", e);
    }
    return () => corte.abort();
  }, []);

  return null;
}
