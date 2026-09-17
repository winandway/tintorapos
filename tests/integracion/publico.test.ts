import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as estadoPublico } from "@/app/datos/publico/orden/[codigo]/route";
import { POST as mcp } from "@/app/mcp/route";
import { codigoDeEtiqueta, ordenPublica } from "@/server/publico/orden";
import { usarEntorno } from "../ayuda/mock-entorno";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

describe("página pública de la orden (datos mínimos)", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    await e.env.DB.prepare(
      "update clientes set nombre = 'María José', telefono = '+13055550000' where id = ?",
    )
      .bind(esc.a.ids.clienteId)
      .run();
  });
  afterAll(() => e.cerrar());

  it("muestra solo estado, fechas y primer nombre; nunca teléfono ni importes", async () => {
    const o = await ordenPublica(e.env.DB, esc.a.ids.codigoPublico!.toLowerCase());
    expect(o).toMatchObject({
      numero: 1001,
      estado: "recibida",
      piezas: 1,
      listas: 0,
      tieneSaldo: true,
      primerNombre: "María",
    });
    const texto = JSON.stringify(o);
    expect(texto).not.toContain("3055550000");
    expect(texto).not.toMatch(/cents|total|pagado/i);
    expect(texto).not.toContain(esc.a.id);
  });

  it("códigos inválidos o inexistentes no devuelven nada", async () => {
    expect(await ordenPublica(e.env.DB, "corto")).toBeNull();
    expect(await ordenPublica(e.env.DB, "0".repeat(20))).toBeNull();
    expect(await codigoDeEtiqueta(e.env.DB, "xx")).toBeNull();
    expect(await codigoDeEtiqueta(e.env.DB, "0".repeat(12))).toBeNull();
  });

  it("la etiqueta de una prenda lleva al código público de su orden", async () => {
    const f = await e.env.DB.prepare("select codigo_etiqueta from orden_prendas where id = ?")
      .bind(esc.a.ids.prendaOrdenId)
      .first<{ codigo_etiqueta: string }>();
    expect(await codigoDeEtiqueta(e.env.DB, f!.codigo_etiqueta)).toBe(esc.a.ids.codigoPublico);
  });

  interface RespuestaMcp {
    result?: {
      serverInfo?: { name: string };
      protocolVersion?: string;
      tools?: { name: string }[];
      content?: { text: string }[];
      structuredContent?: { numero?: number };
      isError?: boolean;
    };
    error?: { code: number; message: string };
  }

  const jsonRpc = async (metodo: string, params?: object) => {
    const r = await mcp(
      new Request("https://tintorapos.com/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: metodo, ...(params ? { params } : {}) }),
      }),
    );
    return {
      estado: r.status,
      cuerpo: (await r.json()) as RespuestaMcp,
    };
  };

  it("la dirección pública de la orden responde JSON con el código y 404 sin él", async () => {
    const pedir = async (codigo: string) =>
      estadoPublico(new Request(`https://tintorapos.com/datos/publico/orden/${codigo}`), {
        params: Promise.resolve({ codigo }),
      });
    const buena = await pedir(esc.a.ids.codigoPublico!);
    expect(buena.status).toBe(200);
    const { orden } = (await buena.json()) as { orden: { numero: number; estado: string } };
    expect(orden).toMatchObject({ numero: 1001, estado: "recibida" });
    expect(JSON.stringify(orden)).not.toMatch(/cents|3055550000/);
    expect((await pedir("0".repeat(20))).status).toBe(404);
  });

  it("el servidor MCP se presenta, lista sus herramientas y responde el estado de una orden", async () => {
    const inicio = await jsonRpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
    expect(inicio.cuerpo.result!.serverInfo!.name).toBe("tintora-pos");
    expect(inicio.cuerpo.result!.protocolVersion).toBe("2025-06-18");

    const lista = await jsonRpc("tools/list");
    expect(lista.cuerpo.result!.tools!.map((t) => t.name)).toEqual([
      "estado_de_orden",
      "buscar_guias",
      "sobre_tintora_pos",
    ]);

    const llamada = await jsonRpc("tools/call", {
      name: "estado_de_orden",
      arguments: { codigo: esc.a.ids.codigoPublico },
    });
    expect(llamada.cuerpo.result!.isError).toBe(false);
    expect(llamada.cuerpo.result!.content![0]!.text).toContain("Orden #1001");
    expect(llamada.cuerpo.result!.structuredContent!.numero).toBe(1001);
    // Nunca sale dinero ni teléfono por esta puerta.
    expect(JSON.stringify(llamada.cuerpo.result)).not.toMatch(/cents|3055550000/);

    const guias = await jsonRpc("tools/call", {
      name: "buscar_guias",
      arguments: { consulta: "cerrar la caja", idioma: "es" },
    });
    expect(guias.cuerpo.result!.content![0]!.text).toContain("https://tintorapos.com/es/docs/");

    const inventada = await jsonRpc("tools/call", { name: "borrar_todo", arguments: {} });
    expect(inventada.cuerpo.error!.code).toBe(-32602);

    const malo = await jsonRpc("metodo/que/no/existe");
    expect(malo.cuerpo.error!.code).toBe(-32601);
  });
});
