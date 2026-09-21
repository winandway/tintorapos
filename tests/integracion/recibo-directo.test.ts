import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as recibo } from "@/app/datos/ordenes/[id]/recibo/route";
import { reciboAEscPos, type LineaRecibo } from "@/lib/impresion/recibo";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

type Err = { error: { codigo: string } };

/**
 * CANDADO DE LA IMPRESIÓN DIRECTA: el recibo que sale por la impresora
 * conectada tiene que decir lo mismo que el de pantalla, y respetar la misma
 * regla — pasado el cuarto de hora, reimprimir el recibo del cliente pide la
 * autorización de un gerente. Una ruta nueva no puede ser la puerta de atrás.
 */
describe("recibo para la impresora conectada directo", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  const dueno = new Navegador();

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  }, 120_000);
  afterAll(() => e.cerrar());

  const pedir = (tipo: "recibo" | "interna") =>
    dueno.llamar<{ numero: number; lineas: LineaRecibo[] }>(recibo, {
      params: { id: esc.a.ids.ordenId ?? "" },
      ruta: `/datos/ordenes/${esc.a.ids.ordenId}/recibo?tipo=${tipo}`,
    });

  it("trae el recibo en líneas: número, total, saldo y el QR con la dirección del cliente", async () => {
    const r = await pedir("recibo");
    expect(r.estado).toBe(200);
    const texto = JSON.stringify(r.datos.lineas);
    expect(texto).toContain(`#${r.datos.numero}`);
    expect(texto).toContain("Saldo");
    const qr = r.datos.lineas.find((l) => l.t === "qr");
    expect(qr && qr.t === "qr" && qr.datos).toContain(`/t/${esc.a.ids.codigoPublico}`);
  });

  it("se convierte en bytes que arrancan la impresora, dibujan el QR y cortan el papel", async () => {
    const { lineas } = (await pedir("recibo")).datos;
    const bytes = [...reciboAEscPos(lineas, { ancho: 32 })];
    expect(bytes.slice(0, 5)).toEqual([0x1b, 0x40, 0x1b, 0x74, 2]);
    expect(bytes.slice(-4)).toEqual([0x1d, 0x56, 66, 0]);
    // El comando de QR nativo está adentro.
    const texto = String.fromCharCode(...bytes);
    expect(texto).toContain(String.fromCharCode(0x1d, 0x28, 0x6b));
    // Ningún renglón se pasa del ancho del papel (32 letras en 58 mm).
    const renglones = texto
      .split("\n")
      .map((x) => x.replace(/[\x00-\x1f].?/g, ""))
      .filter((x) => !x.includes("https://"));
    expect(Math.max(...renglones.map((x) => x.length))).toBeLessThanOrEqual(40);
  });

  it("sin cortar el papel si la impresora no tiene cuchilla", async () => {
    const { lineas } = (await pedir("recibo")).datos;
    expect([...reciboAEscPos(lineas, { cortar: false })].slice(-4)).not.toEqual([0x1d, 0x56, 66, 0]);
  });

  it("la copia interna no lleva QR y dice que es copia", async () => {
    const r = await pedir("interna");
    expect(r.estado).toBe(200);
    expect(r.datos.lineas.some((l) => l.t === "qr")).toBe(false);
    expect(JSON.stringify(r.datos.lineas)).toContain("COPIA INTERNA");
  });

  it("pasados 15 minutos, el recibo del cliente pide gerente (la copia interna no)", async () => {
    await e.env.DB.prepare("update ordenes set creada_en = ? where id = ?")
      .bind(Date.now() - 60 * 60_000, esc.a.ids.ordenId)
      .run();
    const bloqueado = await dueno.llamar<Err>(recibo, {
      params: { id: esc.a.ids.ordenId ?? "" },
      ruta: `/datos/ordenes/${esc.a.ids.ordenId}/recibo?tipo=recibo`,
    });
    expect(bloqueado.estado).toBe(403);
    expect(bloqueado.datos.error.codigo).toBe("requiere_autorizacion");
    expect((await pedir("interna")).estado).toBe(200);

    // Con una reimpresión autorizada hace un momento, sí sale.
    await e.env.DB.prepare(
      "insert into auditoria (id, tintoreria_id, usuario_id, accion, entidad, entidad_id, creado_en) values (?, ?, ?, 'orden.reimpresion_recibo', 'orden', ?, ?)",
    )
      .bind(crypto.randomUUID(), esc.a.id, esc.a.duenoId, esc.a.ids.ordenId, Date.now())
      .run();
    expect((await pedir("recibo")).estado).toBe(200);
  });
});
