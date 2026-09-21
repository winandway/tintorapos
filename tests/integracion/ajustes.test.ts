import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as leerTienda, PUT as guardarTienda } from "@/app/datos/ajustes/tienda/route";
import { GET as catalogo } from "@/app/datos/catalogo/route";
import { POST as crearPrenda } from "@/app/datos/catalogo/prendas/route";
import { PUT as editarPrenda } from "@/app/datos/catalogo/prendas/[id]/route";
import { POST as crearServicio } from "@/app/datos/catalogo/servicios/route";
import { PUT as editarServicio } from "@/app/datos/catalogo/servicios/[id]/route";
import { PUT as precios } from "@/app/datos/catalogo/precios/route";
import { GET as listarEmpleados, POST as crearEmpleado } from "@/app/datos/empleados/route";
import { GET as reportes } from "@/app/datos/reportes/route";
import { PATCH as estadoEmpleado, PUT as editarEmpleado } from "@/app/datos/empleados/[id]/route";
import { POST as entrar } from "@/app/datos/sesion/entrar/route";
import type { Catalogo } from "@/server/catalogo";
import type { Empleado } from "@/server/empleados";
import { permisosDe } from "@/server/permisos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { crearUsuario, sesionPara } from "../ayuda/fabrica";

type Err = { error: { codigo: string; campos?: Record<string, string> } };

describe("ajustes: tienda, catálogo, precios y empleados", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let dueno: Navegador;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  });
  afterAll(() => e.cerrar());

  it("datos de la tienda: lee, valida y guarda con auditoría del impuesto", async () => {
    const r = await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda);
    expect(r.datos.tienda).toMatchObject({ moneda: "USD", impuestoBps: 0, diasEntrega: 2 });
    const nuevos = {
      ...r.datos.tienda,
      impuestoBps: 825,
      telefono: "",
      direccion: "Calle Principal 100",
      correo: "",
    };
    const mal = await dueno.llamar<Err>(guardarTienda, {
      metodo: "PUT",
      cuerpo: { ...nuevos, impuestoBps: 99999, zonaHoraria: "No/Existe" },
    });
    expect(mal.datos.error.campos).toMatchObject({ impuestoBps: "fuera_de_rango", zonaHoraria: "zona" });
    expect((await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: nuevos })).estado).toBe(200);
    // Guardar lo mismo no genera ruido en la auditoría.
    expect((await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: nuevos })).estado).toBe(200);
    const leida = await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda);
    expect(leida.datos.tienda).toMatchObject({
      impuestoBps: 825,
      telefono: null,
      direccion: "Calle Principal 100",
    });
    const aud = await e.env.DB.prepare(
      "select detalle from auditoria where tintoreria_id = ? and accion = 'ajustes.tienda'",
    )
      .bind(esc.a.id)
      .all<{ detalle: string }>();
    expect(aud.results).toHaveLength(1);
    expect(JSON.parse(aud.results[0]!.detalle)).toMatchObject({ impuestoAntes: 0, impuestoDespues: 825 });
  });

  /**
   * CANDADO: la tienda decide si cobra al recibir la ropa o al entregarla. Por
   * defecto, lo tradicional (al entregar). La preferencia vive en su propia
   * tabla porque el esquema se aplica en cada publicación y no admite columnas
   * nuevas en `tintorerias`.
   */
  it("la tienda elige cuándo cobra, y por defecto cobra al entregar", async () => {
    const r = await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda);
    expect(r.datos.tienda.politicaCobro).toBe("entrega");

    const guardado = await dueno.llamar(guardarTienda, {
      metodo: "PUT",
      cuerpo: { ...r.datos.tienda, politicaCobro: "recepcion" },
    });
    expect(guardado.estado).toBe(200);
    expect(
      (await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda)).datos.tienda.politicaCobro,
    ).toBe("recepcion");

    // Lo que no es ni «entrega» ni «recepcion» no entra.
    const mal = await dueno.llamar<Err>(guardarTienda, {
      metodo: "PUT",
      cuerpo: { ...r.datos.tienda, politicaCobro: "cuando sea" },
    });
    expect(mal.estado).toBe(400);

    // Y la de otra tintorería no se toca.
    const otra = await e.env.DB.prepare(
      "select count(*) as n from preferencias_tienda where tintoreria_id = ? and clave = 'politica_cobro'",
    )
      .bind(esc.b.id)
      .first<{ n: number }>();
    expect(otra!.n).toBe(0);

    await dueno.llamar(guardarTienda, {
      metodo: "PUT",
      cuerpo: { ...r.datos.tienda, politicaCobro: "entrega" },
    });
  });

  /**
   * CANDADO DEL COBRO POR KILO. Richard (Colombia) reportó que «le falta la
   * facturación por kilo»: todo el sistema decía «libra». La unidad es de cada
   * tienda, sale de su país si nadie la eligió, y el precio es por ESA unidad.
   */
  it("la ropa por peso se cobra en kilos o en libras, según la tienda", async () => {
    // La tienda del escenario es de EE.UU.: nace en libras.
    const r = await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda);
    expect(r.datos.tienda.unidadPeso).toBe("lb");
    const nombres = async (id: string) =>
      (
        await e.env.DB.prepare(
          "select nombre_es, nombre_en from catalogo_servicios where tintoreria_id = ? and unidad = 'libra' order by orden",
        )
          .bind(id)
          .all<{ nombre_es: string; nombre_en: string }>()
      ).results;
    expect(await nombres(esc.a.id)).toEqual([
      { nombre_es: "Lavado por libra", nombre_en: "Wash & fold (per lb)" },
    ]);

    // Pasa a kilos: el servicio de fábrica cambia de nombre con ella.
    expect(
      (await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: { ...r.datos.tienda, unidadPeso: "kg" } }))
        .estado,
    ).toBe(200);
    expect(
      (await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda)).datos.tienda.unidadPeso,
    ).toBe("kg");
    expect(await nombres(esc.a.id)).toEqual([
      { nombre_es: "Lavado por kilo", nombre_en: "Wash & fold (per kg)" },
    ]);
    // La otra tintorería ni se entera.
    expect(await nombres(esc.b.id)).toEqual([
      { nombre_es: "Lavado por libra", nombre_en: "Wash & fold (per lb)" },
    ]);

    // Guardar otra cosa SIN mandar la unidad no la cambia sola.
    const sinUnidad: Record<string, unknown> = { ...r.datos.tienda, ciudad: "Medellín" };
    delete sinUnidad.unidadPeso;
    await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: sinUnidad });
    expect(
      (await dueno.llamar<{ tienda: Record<string, unknown> }>(leerTienda)).datos.tienda.unidadPeso,
    ).toBe("kg");

    // Un nombre que puso el dueño NO se toca al cambiar de unidad.
    await e.env.DB.prepare(
      "update catalogo_servicios set nombre_es = 'Ropa al peso' where tintoreria_id = ? and unidad = 'libra'",
    )
      .bind(esc.a.id)
      .run();
    await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: { ...r.datos.tienda, unidadPeso: "lb" } });
    expect((await nombres(esc.a.id))[0]?.nombre_es).toBe("Ropa al peso");

    // Una unidad inventada se rechaza.
    const mala = await dueno.llamar<Err>(guardarTienda, {
      metodo: "PUT",
      cuerpo: { ...r.datos.tienda, unidadPeso: "arrobas" },
    });
    expect(mala.estado).toBe(400);

    // Se deja como estaba para las demás pruebas.
    await e.env.DB.prepare(
      "update catalogo_servicios set nombre_es = 'Lavado por libra', nombre_en = 'Wash & fold (per lb)' where tintoreria_id = ? and unidad = 'libra'",
    )
      .bind(esc.a.id)
      .run();
    await dueno.llamar(guardarTienda, { metodo: "PUT", cuerpo: { ...r.datos.tienda, unidadPeso: "lb" } });
  });

  it("una tienda de fuera de EE.UU. nace en kilos, con su «Lavado por kilo»", async () => {
    const { registrarTintoreria } = await import("@/server/cuentas/registro");
    const { leerTienda: leer } = await import("@/server/ajustes/tienda");
    const co = await registrarTintoreria(e.env.DB, {
      negocio: "Tienda de kilos",
      nombre: "Dueña de kilos",
      correo: "kilos@ejemplo.com",
      clave: "Clave-Segura-2026",
      zonaHoraria: "America/Bogota",
      idioma: "es",
      pais: "CO",
      moneda: "COP",
    });
    expect((await leer(e.env.DB, co.tintoreriaId)).unidadPeso).toBe("kg");
    const s = await e.env.DB.prepare(
      "select nombre_es from catalogo_servicios where tintoreria_id = ? and unidad = 'libra'",
    )
      .bind(co.tintoreriaId)
      .first<{ nombre_es: string }>();
    expect(s?.nombre_es).toBe("Lavado por kilo");
  });

  it("catálogo: crear, editar, desactivar y precios por pieza y por libra", async () => {
    const p = await dueno.llamar<{ id: string }>(crearPrenda, {
      cuerpo: { nombreEs: "Chaleco", nombreEn: "Vest" },
    });
    expect(p.estado).toBe(200);
    const s = await dueno.llamar<{ id: string }>(crearServicio, {
      cuerpo: { nombreEs: "Lavado de edredón", nombreEn: "", unidad: "libra", aplicaImpuesto: false },
    });
    expect(
      (
        await dueno.llamar(editarPrenda, {
          metodo: "PUT",
          params: { id: p.datos.id },
          cuerpo: { nombreEs: "Chaleco", nombreEn: "Vest", activo: false },
        })
      ).estado,
    ).toBe(200);
    expect(
      (
        await dueno.llamar(editarServicio, {
          metodo: "PUT",
          params: { id: s.datos.id },
          cuerpo: { nombreEs: "Edredón por libra", unidad: "libra", aplicaImpuesto: false, diasEntrega: 3 },
        })
      ).estado,
    ).toBe(200);
    expect(
      (
        await dueno.llamar(editarPrenda, {
          metodo: "PUT",
          params: { id: "no-existe" },
          cuerpo: { nombreEs: "X" },
        })
      ).estado,
    ).toBe(404);

    const ok = await dueno.llamar(precios, {
      metodo: "PUT",
      cuerpo: {
        precios: [
          { servicioId: esc.a.ids.servicioId, prendaId: p.datos.id, precioCents: 650 },
          { servicioId: s.datos.id, prendaId: "lo-que-sea", precioCents: 199 },
          { servicioId: esc.a.ids.servicioId, prendaId: esc.a.ids.prendaId, precioCents: null },
        ],
      },
    });
    expect(ok.estado).toBe(200);
    const cat = await dueno.llamar<Catalogo>(catalogo);
    expect(cat.datos.prendas.find((x) => x.id === p.datos.id)).toMatchObject({
      nombreEn: "Vest",
      activo: false,
    });
    expect(cat.datos.servicios.find((x) => x.id === s.datos.id)).toMatchObject({
      nombreEs: "Edredón por libra",
      nombreEn: null,
      unidad: "libra",
      diasEntrega: 3,
    });
    expect(cat.datos.precios).toContainEqual({ servicioId: s.datos.id, prendaId: "", precioCents: 199 });
    expect(cat.datos.precios).toContainEqual({
      servicioId: esc.a.ids.servicioId,
      prendaId: p.datos.id,
      precioCents: 650,
    });
    expect(cat.datos.precios.find((x) => x.prendaId === esc.a.ids.prendaId)).toBeUndefined();
  });

  it("un cajero ve el catálogo para el mostrador pero no lo cambia", async () => {
    const cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
    expect((await cajero.llamar(catalogo)).estado).toBe(200);
    expect((await cajero.llamar(crearPrenda, { cuerpo: { nombreEs: "X" } })).estado).toBe(403);
    expect((await cajero.llamar(leerTienda)).estado).toBe(403);
    expect((await cajero.llamar(listarEmpleados)).estado).toBe(403);
  });

  it("empleados: reglas de PIN, correo solo para gerentes, clave temporal y regla Soporte", async () => {
    const debil = await dueno.llamar<Err>(crearEmpleado, {
      cuerpo: { nombre: "Ana", rol: "cajero", pin: "1234" },
    });
    expect(debil.datos.error.codigo).toBe("pin_debil");
    const sinPin = await dueno.llamar<Err>(crearEmpleado, { cuerpo: { nombre: "Ana", rol: "cajero" } });
    expect(sinPin.datos.error.campos).toEqual({ pin: "requerido" });
    const cajeroConCorreo = await dueno.llamar<Err>(crearEmpleado, {
      cuerpo: {
        nombre: "Ana",
        rol: "cajero",
        pin: "4829",
        correo: "ana@tienda.com",
        claveTemporal: "Temporal-2026-x",
      },
    });
    expect(cajeroConCorreo.datos.error.campos).toEqual({ correo: "invalido" });
    const soporte = await dueno.llamar<Err>(crearEmpleado, {
      cuerpo: {
        nombre: "Carlos",
        rol: "gerente",
        correo: "carlos@windoce.com",
        claveTemporal: "Temporal-2026-x",
      },
    });
    expect(soporte.datos.error.codigo).toBe("soporte_nombre");

    const gerente = await dueno.llamar<{ id: string }>(crearEmpleado, {
      cuerpo: {
        nombre: "Gerente de turno",
        rol: "gerente",
        pin: "7391",
        correo: "gerente@tienda-a.com",
        claveTemporal: "Temporal-2026-x",
      },
    });
    expect(gerente.estado).toBe(200);
    const login = await new Navegador().llamar(entrar, {
      cuerpo: { correo: "gerente@tienda-a.com", clave: "Temporal-2026-x" },
    });
    expect(login.datos).toEqual({ ok: true, siguiente: "cambiar_clave" });

    const lista = await dueno.llamar<{ empleados: Empleado[] }>(listarEmpleados);
    expect(lista.datos.empleados.map((x) => x.rol)).toEqual(["dueno", "gerente", "cajero"]);
    expect(lista.datos.empleados.find((x) => x.id === gerente.datos.id)).toMatchObject({
      tienePin: true,
      correo: "gerente@tienda-a.com",
    });
  });

  it("un gerente no gestiona gerentes ni dueños; nadie deja la tienda sin dueño", async () => {
    const lista = await dueno.llamar<{ empleados: Empleado[] }>(listarEmpleados);
    const gerenteId = lista.datos.empleados.find((x) => x.rol === "gerente")!.id;
    const g = new Navegador();
    g.cookies.set("tp_sesion", await sesionPara(e.env.DB, esc.a.id, gerenteId));
    await e.env.DB.prepare("update usuarios set debe_cambiar_clave = 0 where id = ?").bind(gerenteId).run();
    expect(
      (await g.llamar(crearEmpleado, { cuerpo: { nombre: "Otro gerente", rol: "gerente", pin: "4829" } }))
        .estado,
    ).toBe(403);
    expect(
      (
        await g.llamar(estadoEmpleado, {
          metodo: "PATCH",
          params: { id: esc.a.duenoId },
          cuerpo: { activo: false },
        })
      ).estado,
    ).toBe(403);
    const planta = await g.llamar<{ id: string }>(crearEmpleado, {
      cuerpo: { nombre: "Planchadora", rol: "planta", pin: "3917" },
    });
    expect(planta.estado).toBe(200);
    expect(
      (
        await g.llamar(editarEmpleado, {
          metodo: "PUT",
          params: { id: planta.datos.id },
          cuerpo: { nombre: "Planchadora", rol: "gerente" },
        })
      ).estado,
    ).toBe(403);

    const ultimo = await dueno.llamar<Err>(editarEmpleado, {
      metodo: "PUT",
      params: { id: esc.a.duenoId },
      cuerpo: { nombre: "Dueño", rol: "gerente" },
    });
    expect(ultimo.datos.error.codigo).toBe("ultimo_dueno");
    expect(
      (
        await dueno.llamar<Err>(estadoEmpleado, {
          metodo: "PATCH",
          params: { id: esc.a.duenoId },
          cuerpo: { activo: false },
        })
      ).datos.error.codigo,
    ).toBe("no_aplica");

    // Desactivar corta las sesiones del empleado en el acto.
    const sesionPlanta = new Navegador();
    sesionPlanta.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, planta.datos.id, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
    expect(
      (
        await dueno.llamar(estadoEmpleado, {
          metodo: "PATCH",
          params: { id: planta.datos.id },
          cuerpo: { activo: false },
        })
      ).estado,
    ).toBe(200);
    expect((await sesionPlanta.llamar(catalogo)).estado).toBe(401);
    expect(
      (
        await dueno.llamar(estadoEmpleado, {
          metodo: "PATCH",
          params: { id: planta.datos.id },
          cuerpo: { activo: true },
        })
      ).estado,
    ).toBe(200);

    // Cambiar PIN desbloquea; quitar el correo quita la contraseña.
    expect(
      (
        await dueno.llamar(editarEmpleado, {
          metodo: "PUT",
          params: { id: gerenteId },
          cuerpo: { nombre: "Gerente", rol: "gerente", correo: "", pin: "8264" },
        })
      ).estado,
    ).toBe(200);
    const fila = await e.env.DB.prepare("select correo, clave_hash from usuarios where id = ?")
      .bind(gerenteId)
      .first();
    expect(fila).toEqual({ correo: null, clave_hash: null });
  });

  it("palomitas por empleado: se guardan solo si cambian, mandan sobre el rol y nadie da lo que no tiene", async () => {
    const cajeroDeRol = permisosDe("cajero");
    // 1. Un cajero con un permiso de más: ver reportes.
    const conReportes = await dueno.llamar<{ id: string }>(crearEmpleado, {
      cuerpo: {
        nombre: "Cajera con reportes",
        rol: "cajero",
        pin: "5137",
        permisos: [...cajeroDeRol, "reportes.ver"],
      },
    });
    expect(conReportes.estado).toBe(200);

    const lista = await dueno.llamar<{ empleados: Empleado[] }>(listarEmpleados);
    const guardada = lista.datos.empleados.find((x) => x.id === conReportes.datos.id)!;
    expect(guardada.permisos).toContain("reportes.ver");

    // Entra con su PIN y de verdad puede ver los reportes (antes, 403).
    const tablet = new Navegador();
    tablet.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, conReportes.datos.id, { tipo: "pin" }),
    );
    expect((await tablet.llamar(reportes)).estado).toBe(200);

    // 2. Si se le quitan, vuelve a lo del rol y deja de entrar.
    await dueno.llamar(editarEmpleado, {
      metodo: "PUT",
      params: { id: conReportes.datos.id },
      cuerpo: { nombre: "Cajera con reportes", rol: "cajero", permisos: cajeroDeRol },
    });
    const sinExtra = await dueno.llamar<{ empleados: Empleado[] }>(listarEmpleados);
    expect(sinExtra.datos.empleados.find((x) => x.id === conReportes.datos.id)!.permisos).toBeNull();
    expect((await tablet.llamar(reportes)).estado).toBe(403);

    // 3. Nadie reparte lo que no tiene: un gerente no puede dar «exportar datos».
    const gerenteId = await crearUsuario(e.env.DB, esc.a.id, "gerente", { nombre: "Gerenta", pin: "8461" });
    const gerenteNav = new Navegador();
    gerenteNav.cookies.set("tp_sesion", await sesionPara(e.env.DB, esc.a.id, gerenteId));
    const intento = await gerenteNav.llamar<{ id: string }>(crearEmpleado, {
      cuerpo: {
        nombre: "Cajero listo",
        rol: "cajero",
        pin: "9274",
        permisos: [...cajeroDeRol, "datos.exportar"],
      },
    });
    expect(intento.estado).toBe(200);
    const despues = await dueno.llamar<{ empleados: Empleado[] }>(listarEmpleados);
    const creado = despues.datos.empleados.find((x) => x.id === intento.datos.id)!;
    expect(creado.permisos ?? []).not.toContain("datos.exportar");
  });
});
