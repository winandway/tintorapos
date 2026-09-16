import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as subir } from "@/app/datos/fotos/route";
import { DELETE as borrar } from "@/app/datos/fotos/[id]/route";
import { GET as servir } from "@/app/media/fotos/[id]/route";
import { GET as verOrden } from "@/app/datos/ordenes/[id]/route";
import { tipoImagen } from "@/server/fotos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { sesionPara } from "../ayuda/fabrica";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 9, 9, 9, 9, 9]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new Uint8Array([
  ...new TextEncoder().encode("RIFF"),
  0,
  0,
  0,
  0,
  ...new TextEncoder().encode("WEBP"),
]);

function formulario(campos: Record<string, string | Blob>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

describe("fotos de prendas", () => {
  let e: EntornoPrueba;
  let esc: Escenario;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
  });
  afterAll(() => e.cerrar());

  it("reconoce el tipo real por los bytes", () => {
    expect(tipoImagen(JPEG)?.mime).toBe("image/jpeg");
    expect(tipoImagen(PNG)?.mime).toBe("image/png");
    expect(tipoImagen(WEBP)?.mime).toBe("image/webp");
    expect(tipoImagen(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("sube, sirve solo a su tintorería y borra con permiso de gerente", async () => {
    const dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
    const r = await dueno.llamar<{ id: string }>(subir, {
      metodo: "POST",
      cuerpoCrudo: formulario({
        foto: new Blob([PNG]),
        ordenId: esc.a.ids.ordenId!,
        prendaId: esc.a.ids.prendaOrdenId!,
      }),
    });
    expect(r.estado).toBe(200);
    const orden = await dueno.llamar<{ orden: { fotos: { id: string }[] } }>(verOrden, {
      params: { id: esc.a.ids.ordenId! },
    });
    expect(orden.datos.orden.fotos.map((f) => f.id)).toContain(r.datos.id);

    const img = await dueno.llamar(servir, { params: { id: r.datos.id } });
    expect(img.estado).toBe(200);
    expect(img.respuesta.headers.get("content-type")).toBe("image/png");
    expect(img.respuesta.headers.get("cache-control")).toContain("private");

    const ajeno = new Navegador();
    ajeno.cookies.set("tp_sesion", esc.b.sesionDueno);
    expect((await ajeno.llamar(servir, { params: { id: r.datos.id } })).estado).toBe(404);
    const subirAjeno = await ajeno.llamar(subir, {
      metodo: "POST",
      cuerpoCrudo: formulario({ foto: new Blob([JPEG]), ordenId: esc.a.ids.ordenId! }),
    });
    expect(subirAjeno.estado).toBe(404);
    const prendaAjena = await ajeno.llamar(subir, {
      metodo: "POST",
      cuerpoCrudo: formulario({
        foto: new Blob([JPEG]),
        ordenId: esc.b.ids.ordenId!,
        prendaId: esc.a.ids.prendaOrdenId!,
      }),
    });
    expect(prendaAjena.estado).toBe(404);
    expect((await new Navegador().llamar(servir, { params: { id: r.datos.id } })).estado).toBe(401);

    const cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
    expect((await cajero.llamar(borrar, { metodo: "DELETE", params: { id: r.datos.id } })).estado).toBe(403);
    expect((await dueno.llamar(borrar, { metodo: "DELETE", params: { id: r.datos.id } })).estado).toBe(200);
    expect((await dueno.llamar(servir, { params: { id: r.datos.id } })).estado).toBe(404);
    expect((await dueno.llamar(borrar, { metodo: "DELETE", params: { id: r.datos.id } })).estado).toBe(404);
  });

  it("rechaza archivos que no son fotos, formularios incompletos y reintentos duplican nada", async () => {
    const dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
    const svg = await dueno.llamar<{ error: { codigo: string } }>(subir, {
      metodo: "POST",
      cuerpoCrudo: formulario({
        foto: new Blob(["<svg></svg>"], { type: "image/jpeg" }),
        ordenId: esc.a.ids.ordenId!,
      }),
    });
    expect(svg.datos.error.codigo).toBe("tipo_archivo");
    expect(
      (
        await dueno.llamar(subir, {
          metodo: "POST",
          cuerpoCrudo: formulario({ ordenId: esc.a.ids.ordenId! }),
        })
      ).estado,
    ).toBe(400);
    expect(
      (
        await dueno.llamar(subir, {
          metodo: "POST",
          cuerpoCrudo: "no es formulario",
          cabeceras: { "content-type": "multipart/form-data; boundary=x" },
        })
      ).estado,
    ).toBe(400);
    const grande = await dueno.llamar<{ error: { codigo: string } }>(subir, {
      metodo: "POST",
      cuerpoCrudo: formulario({
        foto: new Blob([JPEG, new Uint8Array(5 * 1024 * 1024)]),
        ordenId: esc.a.ids.ordenId!,
      }),
    });
    expect(grande.datos.error.codigo).toBe("archivo_grande");
    const id = "12345678-1234-4234-8234-123456789012";
    const f = () => formulario({ foto: new Blob([JPEG]), ordenId: esc.a.ids.ordenId!, id });
    expect((await dueno.llamar<{ id: string }>(subir, { metodo: "POST", cuerpoCrudo: f() })).datos.id).toBe(
      id,
    );
    expect((await dueno.llamar<{ id: string }>(subir, { metodo: "POST", cuerpoCrudo: f() })).datos.id).toBe(
      id,
    );
    const n = await e.env.DB.prepare("select count(*) as n from fotos where id = ?")
      .bind(id)
      .first<{ n: number }>();
    expect(n?.n).toBe(1);
  });
});
