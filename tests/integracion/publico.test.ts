import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as estadoPublico } from "@/app/datos/publico/orden/[codigo]/route";
import { POST as a2a } from "@/app/a2a/route";
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

  it("la puerta A2A responde un mensaje de otro agente con la herramienta que toca", async () => {
    const enviar = async (texto: string) => {
      const r = await a2a(
        new Request("https://tintorapos.com/a2a", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 7,
            method: "message/send",
            params: {
              message: {
                role: "user",
                kind: "message",
                messageId: "m1",
                parts: [{ kind: "text", text: texto }],
              },
            },
          }),
        }),
      );
      return (await r.json()) as {
        result?: { parts?: { text: string }[]; metadata?: { herramienta: string } };
        error?: { code: number };
      };
    };

    const estado = await enviar(`¿Está lista mi orden? El código del recibo es ${esc.a.ids.codigoPublico}`);
    expect(estado.result!.metadata!.herramienta).toBe("estado_de_orden");
    expect(estado.result!.parts![0]!.text).toContain("Orden #1001");

    const guia = await enviar("¿Cómo cierro la caja al final del día?");
    expect(guia.result!.metadata!.herramienta).toBe("buscar_guias");

    const producto = await enviar("What is Tintora POS?");
    expect(producto.result!.metadata!.herramienta).toBe("sobre_tintora_pos");
    expect(producto.result!.parts![0]!.text).toContain("does NOT process cards");

    const vacio = await enviar("   ");
    expect(vacio.error!.code).toBe(-32602);
  });

  it("contacto: el mensaje abre un billete y no se pierde nunca", async () => {
    const { POST: contacto } = await import("@/app/datos/contacto/route");
    const enviar = async (cuerpo: object) =>
      contacto(
        new Request("https://tintorapos.com/datos/contacto", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cuerpo),
        }),
        { params: Promise.resolve({}) },
      );
    const ok = await enviar({
      nombre: "Dueña interesada",
      correo: "interesada@tintoreria.com",
      asunto: "Precios",
      mensaje: "Hola, quiero saber cuánto cuesta para dos tiendas.",
    });
    expect(ok.status).toBe(200);
    const fila = await e.env.DB.prepare(
      `select t.nombre, t.correo, t.numero, t.estado, m.cuerpo from tickets t
         join ticket_mensajes m on m.ticket_id = t.id and m.de = 'cliente'
       order by t.creado_en desc limit 1`,
    ).first<{ nombre: string; correo: string; numero: number; estado: string; cuerpo: string }>();
    expect(fila).toMatchObject({
      nombre: "Dueña interesada",
      correo: "interesada@tintoreria.com",
      estado: "abierto",
    });
    expect(fila!.numero).toBeGreaterThan(1000);
    expect(fila!.cuerpo).toContain("cuánto cuesta");

    // Lo corto o sin correo no entra.
    expect((await enviar({ nombre: "A", correo: "no-es-correo", mensaje: "hola" })).status).toBe(400);
  });
});
