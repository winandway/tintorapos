import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as buscar, POST as crear } from "@/app/datos/clientes/route";
import { DELETE as eliminar, GET as ver, PUT as editar } from "@/app/datos/clientes/[id]/route";
import { POST as restaurar } from "@/app/datos/clientes/[id]/restaurar/route";
import { anonimizarClientesVencidos, type ClienteFicha, type ClienteResumen } from "@/server/clientes";
import { normalizarTelefono } from "@/server/cuentas/validaciones";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { crearUsuario, sesionPara } from "../ayuda/fabrica";

type Err = {
  error: { codigo: string; mensaje: string; campos?: Record<string, string>; vars?: Record<string, string> };
};

describe("clientes (datos personales, candado 90 %)", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let dueno: Navegador;
  let cajero: Navegador;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
    cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
  });
  afterAll(() => e.cerrar());

  it("normaliza teléfonos de EE.UU. y Latinoamérica", () => {
    expect(normalizarTelefono("(312) 555-0100", "US")).toEqual({
      e164: "+13125550100",
      digitos: "3125550100",
    });
    expect(normalizarTelefono("1 312 555 0100", "US")).toEqual({
      e164: "+13125550100",
      digitos: "3125550100",
    });
    expect(normalizarTelefono("300 123 4567", "CO")).toEqual({
      e164: "+573001234567",
      digitos: "3001234567",
    });
    expect(normalizarTelefono("+52 55 1234 5678", "US")).toEqual({
      e164: "+525512345678",
      digitos: "525512345678",
    });
    expect(normalizarTelefono("555", "US")).toBeNull();
    expect(normalizarTelefono("12", "MX")).toBeNull();
    expect(normalizarTelefono("+123", "US")).toBeNull();
    expect(normalizarTelefono("", "US")).toBeNull();
  });

  it("el cajero crea un cliente con permiso de SMS registrado con fecha; teléfono repetido avisa", async () => {
    const r = await cajero.llamar<{ id: string }>(crear, {
      cuerpo: {
        nombre: "María",
        apellido: "González",
        telefono: "(305) 555-0142",
        correo: "",
        idioma: "es",
        preferencias: { almidon: "ligero", entrega: "gancho" },
        aceptaSms: true,
        aceptaCorreo: true,
      },
    });
    expect(r.estado).toBe(200);
    const fila = await e.env.DB.prepare(
      "select telefono, acepta_sms, acepta_sms_en, acepta_correo from clientes where id = ?",
    )
      .bind(r.datos.id)
      .first<Record<string, unknown>>();
    expect(fila).toMatchObject({ telefono: "+13055550142", acepta_sms: 1, acepta_correo: 0 });
    expect(fila?.acepta_sms_en).toBeTypeOf("number");

    const repetido = await cajero.llamar<Err>(crear, {
      cuerpo: { nombre: "Otra", telefono: "305.555.0142", idioma: "en" },
    });
    expect(repetido.estado).toBe(409);
    expect(repetido.datos.error.mensaje).toContain("María");
    expect(repetido.datos.error.vars?.clienteId).toBe(r.datos.id);

    const malTel = await cajero.llamar<Err>(crear, {
      cuerpo: { nombre: "Otra", telefono: "12", idioma: "en" },
    });
    expect(malTel.datos.error.campos).toEqual({ telefono: "telefono" });
  });

  it("busca por teléfono (parcial) y por nombre, sin ver otras tintorerías", async () => {
    const porTel = await cajero.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?q=555-0142",
    });
    expect(porTel.datos.clientes.map((c) => c.nombre)).toEqual(["María"]);
    const porNombre = await cajero.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?q=gonz",
    });
    expect(porNombre.datos.clientes).toHaveLength(1);
    const completo = await cajero.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?q=maría%20gonzález",
    });
    expect(completo.datos.clientes).toHaveLength(1);
    const todos = await cajero.llamar<{ clientes: ClienteResumen[] }>(buscar);
    expect(todos.datos.clientes.length).toBe(2);
    const ajeno = await cajero.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?q=marca-unica-bbbb",
    });
    expect(ajeno.datos.clientes).toHaveLength(0);
  });

  it("editar: quitar y volver a dar permiso de SMS actualiza la fecha; ficha con historial", async () => {
    const { datos } = await dueno.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?q=María",
    });
    const id = datos.clientes[0]!.id;
    const base = {
      nombre: "María",
      apellido: "González",
      telefono: "3055550142",
      idioma: "en",
      preferencias: { sinBolsa: true },
    };
    expect(
      (await dueno.llamar(editar, { metodo: "PUT", params: { id }, cuerpo: { ...base, aceptaSms: false } }))
        .estado,
    ).toBe(200);
    let ficha = (await dueno.llamar<{ cliente: ClienteFicha }>(ver, { params: { id } })).datos.cliente;
    expect(ficha).toMatchObject({
      idioma: "en",
      aceptaSms: false,
      aceptaSmsEn: null,
      preferencias: { sinBolsa: true },
      ordenes: [],
    });
    expect(
      (
        await dueno.llamar(editar, {
          metodo: "PUT",
          params: { id },
          cuerpo: { ...base, aceptaSms: true, correo: "maria@correo.com", aceptaCorreo: true },
        })
      ).estado,
    ).toBe(200);
    ficha = (await dueno.llamar<{ cliente: ClienteFicha }>(ver, { params: { id } })).datos.cliente;
    expect(ficha.aceptaSms).toBe(true);
    expect(ficha.aceptaCorreo).toBe(true);
    expect(ficha.aceptaSmsEn).toBeTypeOf("number");

    const otro = await dueno.llamar<Err>(editar, {
      metodo: "PUT",
      params: { id: esc.a.ids.clienteId! },
      cuerpo: { ...base, telefono: "305-555-0142" },
    });
    expect(otro.datos.error.codigo).toBe("cliente_repetido");
    expect(
      (await dueno.llamar(editar, { metodo: "PUT", params: { id: "no-existe" }, cuerpo: base })).estado,
    ).toBe(404);
  });

  it("planta no ve fichas; cajero no borra; papelera, restaurar y anonimizar a los 30 días", async () => {
    const planta = new Navegador();
    const plantaId = await crearUsuario(e.env.DB, esc.a.id, "planta", { pin: "3917" });
    planta.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, plantaId, { tipo: "pin", dispositivoId: esc.a.dispositivoId }),
    );
    expect((await planta.llamar(buscar)).estado).toBe(403);

    const id = esc.a.ids.clienteId!;
    expect((await cajero.llamar(eliminar, { metodo: "DELETE", params: { id } })).estado).toBe(403);
    expect((await dueno.llamar(eliminar, { metodo: "DELETE", params: { id } })).estado).toBe(200);
    expect((await dueno.llamar(eliminar, { metodo: "DELETE", params: { id } })).estado).toBe(404);
    expect(
      (await dueno.llamar<{ clientes: ClienteResumen[] }>(buscar)).datos.clientes.map((c) => c.id),
    ).not.toContain(id);
    const papelera = await dueno.llamar<{ clientes: ClienteResumen[] }>(buscar, {
      ruta: "/datos/clientes?papelera=1",
    });
    expect(papelera.datos.clientes.map((c) => c.id)).toEqual([id]);
    expect((await dueno.llamar(restaurar, { metodo: "POST", params: { id } })).estado).toBe(200);
    expect((await dueno.llamar(restaurar, { metodo: "POST", params: { id } })).estado).toBe(404);

    await dueno.llamar(eliminar, { metodo: "DELETE", params: { id } });
    expect(await anonimizarClientesVencidos(e.env.DB)).toBe(0);
    expect(await anonimizarClientesVencidos(e.env.DB, Date.now() + 31 * 24 * 3600_000)).toBe(1);
    const fila = await e.env.DB.prepare(
      "select nombre, telefono, telefono_digitos, anonimizado_en from clientes where id = ?",
    )
      .bind(id)
      .first<Record<string, unknown>>();
    expect(fila).toMatchObject({ nombre: "—", telefono: null, telefono_digitos: null });
    expect((await dueno.llamar(restaurar, { metodo: "POST", params: { id } })).estado).toBe(404);
    expect((await dueno.llamar(ver, { params: { id } })).estado).toBe(404);
  });
});
