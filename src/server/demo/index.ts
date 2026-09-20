/**
 * El demo público: cualquiera entra desde la página de venta y cae en SU PROPIA
 * tintorería, con un día de trabajo ya cargado — clientes, catálogo con precios,
 * órdenes en todos los estados, cobros y la caja abierta. Puede tocar todo:
 * crear órdenes, cobrar, cerrar caja, agregar empleados.
 *
 * Tres candados, porque esto lo abre gente de la calle:
 *  1. Cada demo vive `HORAS_DEMO` y el reloj la borra entera (incluidas las
 *     fotos del almacén). Nada se queda para siempre.
 *  2. Plan `demo`: no manda ni un correo (ver `encolarAvisos`) y no se respalda.
 *  3. Tope de demos vivas: si se llena, se limpia y, si aún así no cabe, se
 *     responde que vuelva en un rato. Una base llena de demos es una base caída.
 */
import { codigoEtiqueta, codigoPublico, nuevoId } from "@/lib/codigos";
import type { Idioma } from "@/lib/i18n/idiomas";
import { PRENDAS_ESTANDAR, SERVICIOS_ESTANDAR } from "@/server/catalogo/estandar";

export const PLAN_DEMO = "demo";
/** Cuánto vive un demo antes de que el reloj lo borre. */
export const HORAS_DEMO = 24;
/** Cuántos demos pueden existir a la vez. */
export const MAX_DEMOS_VIVAS = 500;

export interface Demo {
  tintoreriaId: string;
  sucursalId: string;
  usuarioId: string;
}

/** Precios de la tienda de demostración, en centavos. */
const PRECIO_BASE: Record<string, number> = {
  seco: 899,
  lavado_planchado: 399,
  planchado: 299,
  libra: 199,
  arreglos: 1200,
};

const NOMBRE_TIENDA: Record<Idioma, string> = {
  es: "Tintorería Demo",
  en: "Demo Dry Cleaners",
};

const CLIENTES = [
  { nombre: "Ana", apellido: "Martínez" },
  { nombre: "Luis", apellido: "Gómez" },
  { nombre: "Carla", apellido: "Rivas" },
  { nombre: "Marta", apellido: "Ochoa" },
  { nombre: "Diego", apellido: "Salas" },
];

interface Pedido {
  cliente: number;
  estado: "recibida" | "en_proceso" | "lista" | "entregada";
  prendas: number[];
  pagado: "no" | "parcial" | "total";
  horas: number;
  urgente?: boolean;
}

/** Un día de trabajo de verdad: si las pantallas salen vacías, el demo no vende. */
const PEDIDOS: Pedido[] = [
  { cliente: 0, estado: "lista", prendas: [0, 0, 2], pagado: "parcial", horas: 26 },
  { cliente: 1, estado: "en_proceso", prendas: [5, 9], pagado: "no", horas: 20 },
  { cliente: 2, estado: "recibida", prendas: [4, 3, 1], pagado: "total", horas: 4 },
  { cliente: 3, estado: "lista", prendas: [0, 1], pagado: "no", horas: 30, urgente: true },
  { cliente: 4, estado: "entregada", prendas: [0, 0, 0, 2], pagado: "total", horas: 50 },
  { cliente: 0, estado: "recibida", prendas: [6], pagado: "no", horas: 2 },
  { cliente: 1, estado: "en_proceso", prendas: [2, 3], pagado: "parcial", horas: 12 },
  { cliente: 2, estado: "entregada", prendas: [5], pagado: "total", horas: 70 },
];

const IMPUESTO_BPS = 700;
const RECARGO_BPS = 5000;

/** Cuántos demos hay ahora mismo. */
export async function demosVivas(db: D1Database): Promise<number> {
  const f = await db
    .prepare("select count(*) as n from tintorerias /* global: contar los demos de todos */ where plan = ?")
    .bind(PLAN_DEMO)
    .first<{ n: number }>();
  return f?.n ?? 0;
}

/**
 * Crea la tintorería de demostración con todo adentro. Devuelve los
 * identificadores para abrir la sesión.
 */
export async function crearDemo(db: D1Database, idioma: Idioma, ahora = Date.now()): Promise<Demo> {
  const tintoreriaId = nuevoId();
  const sucursalId = nuevoId();
  const usuarioId = nuevoId();
  const turnoId = nuevoId();
  const s: D1PreparedStatement[] = [];

  s.push(
    db
      .prepare(
        `insert into tintorerias (id, nombre, telefono, pais, zona_horaria, moneda, idioma, impuesto_bps,
           recargo_urgente_bps, dias_entrega, plan, prueba_hasta, proximo_numero, creada_en, actualizada_en)
         values (?, ?, '3055550100', 'US', 'America/New_York', 'USD', ?, ?, ?, 2, ?, null, ?, ?, ?)`,
      )
      .bind(
        tintoreriaId,
        NOMBRE_TIENDA[idioma],
        idioma,
        IMPUESTO_BPS,
        RECARGO_BPS,
        PLAN_DEMO,
        1001 + PEDIDOS.length,
        ahora,
        ahora,
      ),
    db
      .prepare("insert into sucursales (id, tintoreria_id, nombre, activa, creada_en) values (?, ?, ?, 1, ?)")
      .bind(sucursalId, tintoreriaId, idioma === "en" ? "Main" : "Principal", ahora),
    // Sin correo y sin contraseña: a este usuario no se entra por la pantalla de
    // acceso ni se le puede pedir recuperación. Solo vive mientras dure la sesión.
    db
      .prepare(
        `insert into usuarios (id, tintoreria_id, nombre, rol, correo, clave_hash, totp_activo, activo, creado_en, actualizado_en)
         values (?, ?, ?, 'dueno', null, null, 0, 1, ?, ?)`,
      )
      .bind(usuarioId, tintoreriaId, idioma === "en" ? "Demo owner" : "Dueño del demo", ahora, ahora),
  );

  const servicios = SERVICIOS_ESTANDAR.map((x, i) => ({ ...x, id: nuevoId(), orden: i }));
  const prendas = PRENDAS_ESTANDAR.map((x, i) => ({ ...x, id: nuevoId(), orden: i }));
  for (const x of servicios)
    s.push(
      db
        .prepare(
          `insert into catalogo_servicios (id, tintoreria_id, nombre_es, nombre_en, unidad, aplica_impuesto, orden, activo, creado_en)
           values (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(x.id, tintoreriaId, x.es, x.en, x.unidad, x.impuesto ? 1 : 0, x.orden, ahora),
    );
  for (const x of prendas)
    s.push(
      db
        .prepare(
          `insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, orden, activo, creado_en)
           values (?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(x.id, tintoreriaId, x.es, x.en, x.orden, ahora),
    );
  const precioDe = (servicioClave: string, indicePrenda: number) =>
    (PRECIO_BASE[servicioClave] ?? 500) + indicePrenda * 100;
  for (const x of servicios) {
    if (x.unidad === "libra") {
      s.push(
        db
          .prepare(
            "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, '', ?, ?)",
          )
          .bind(tintoreriaId, x.id, PRECIO_BASE[x.clave] ?? 500, ahora),
      );
      continue;
    }
    for (const p of prendas)
      s.push(
        db
          .prepare(
            "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, ?, ?)",
          )
          .bind(tintoreriaId, x.id, p.id, precioDe(x.clave, p.orden), ahora),
      );
  }

  // Clientes SIN correo ni teléfono para avisos: el demo no le escribe a nadie.
  const clientes = CLIENTES.map((c) => ({ ...c, id: nuevoId() }));
  clientes.forEach((c, i) =>
    s.push(
      db
        .prepare(
          `insert into clientes (id, tintoreria_id, nombre, apellido, telefono, telefono_digitos, correo, idioma,
             acepta_sms, acepta_correo, creado_por, creado_en, actualizado_en)
           values (?, ?, ?, ?, null, null, null, ?, 0, 0, ?, ?, ?)`,
        )
        .bind(
          c.id,
          tintoreriaId,
          c.nombre,
          c.apellido,
          idioma,
          usuarioId,
          ahora - i * 1000,
          ahora - i * 1000,
        ),
    ),
  );

  s.push(
    db
      .prepare(
        `insert into turnos_caja (id, tintoreria_id, sucursal_id, estado, abierto_por, abierto_en, fondo_cents)
         values (?, ?, ?, 'abierto', ?, ?, 10000)`,
      )
      .bind(turnoId, tintoreriaId, sucursalId, usuarioId, ahora - 6 * 3600_000),
  );

  const seco = servicios[0]!;
  let numero = 1001;
  for (const p of PEDIDOS) {
    const ordenId = nuevoId();
    const creada = ahora - p.horas * 3600_000;
    const subtotal = p.prendas.reduce((t, i) => t + precioDe(seco.clave, i), 0);
    const recargo = p.urgente ? Math.round((subtotal * RECARGO_BPS) / 10_000) : 0;
    const impuesto = Math.round(((subtotal + recargo) * IMPUESTO_BPS) / 10_000);
    const total = subtotal + recargo + impuesto;
    const pagado = p.pagado === "total" ? total : p.pagado === "parcial" ? Math.round(total / 2) : 0;
    const fecha = new Date(creada).toISOString().slice(0, 10);
    const cliente = clientes[p.cliente]!;
    s.push(
      db
        .prepare(
          `insert into ordenes (id, tintoreria_id, sucursal_id, numero, codigo_publico, cliente_id, estado, urgente, fecha_promesa,
             subtotal_cents, recargo_cents, impuesto_cents, total_cents, pagado_cents, impuesto_bps, recargo_bps,
             creada_por, origen, fecha_local, creada_en, actualizada_en, lista_en, entregada_en)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_linea', ?, ?, ?, ?, ?)`,
        )
        .bind(
          ordenId,
          tintoreriaId,
          sucursalId,
          numero,
          codigoPublico(),
          cliente.id,
          p.estado,
          p.urgente ? 1 : 0,
          creada + 2 * 86_400_000,
          subtotal,
          recargo,
          impuesto,
          total,
          pagado,
          IMPUESTO_BPS,
          p.urgente ? RECARGO_BPS : 0,
          usuarioId,
          fecha,
          creada,
          creada,
          p.estado === "lista" || p.estado === "entregada" ? creada + 3600_000 : null,
          p.estado === "entregada" ? creada + 7200_000 : null,
        ),
    );
    p.prendas.forEach((indice, j) => {
      const prenda = prendas[indice]!;
      s.push(
        db
          .prepare(
            `insert into orden_prendas (id, tintoreria_id, orden_id, prenda_id, servicio_id, prenda_es, prenda_en,
               servicio_es, servicio_en, unidad, cantidad, precio_unit_cents, total_cents, aplica_impuesto,
               color, notas, codigo_etiqueta, estado, ubicacion, posicion, creada_en, actualizada_en)
             values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pieza', 1, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            nuevoId(),
            tintoreriaId,
            ordenId,
            prenda.id,
            seco.id,
            prenda.es,
            prenda.en,
            seco.es,
            seco.en,
            precioDe(seco.clave, indice),
            precioDe(seco.clave, indice),
            j === 0 ? (idioma === "en" ? "Navy blue" : "Azul oscuro") : null,
            j === 0 ? (idioma === "en" ? "Broken button" : "Botón roto") : null,
            codigoEtiqueta(),
            p.estado === "entregada" ? "entregada" : p.estado === "lista" ? "lista" : p.estado,
            p.estado === "lista" ? "B-12" : null,
            j,
            creada,
            creada,
          ),
      );
    });
    if (pagado > 0)
      s.push(
        db
          .prepare(
            `insert into pagos (id, tintoreria_id, orden_id, turno_id, metodo, monto_cents, usuario_id, origen, fecha_local, creado_en)
             values (?, ?, ?, ?, ?, ?, ?, 'en_linea', ?, ?)`,
          )
          .bind(
            nuevoId(),
            tintoreriaId,
            ordenId,
            turnoId,
            numero % 3 === 0 ? "tarjeta_externa" : "efectivo",
            pagado,
            usuarioId,
            fecha,
            creada,
          ),
      );
    numero += 1;
  }

  await db.batch(s);
  return { tintoreriaId, sucursalId, usuarioId };
}

/** Las tablas con `tintoreria_id`, en orden de borrado (hijas antes que madres). */
const TABLAS_DEMO = [
  "operaciones_sync",
  "respaldos",
  "auditoria",
  "avisos",
  "pagos",
  "fotos",
  "orden_estados",
  "orden_prendas",
  "ordenes",
  "movimientos_caja",
  "turnos_caja",
  "precios",
  "catalogo_prendas",
  "catalogo_servicios",
  "clientes",
  "sesiones",
  "enlaces_dispositivo",
  "dispositivos",
  "tokens_recuperacion",
  "verificacion_correo",
  "permisos_usuario",
  "usuarios",
  "sucursales",
];

/**
 * Borra los demos vencidos, con sus fotos. Lo llama el reloj. Devuelve cuántas
 * tintorerías de demostración desaparecieron.
 */
export async function limpiarDemos(env: CloudflareEnv, ahora = Date.now()): Promise<number> {
  const db = env.DB;
  const limite = ahora - HORAS_DEMO * 3600_000;
  const { results } = await db
    .prepare(
      `select id from tintorerias /* global: los demos vencidos de todos */
       where plan = ? and creada_en <= ? limit 50`,
    )
    .bind(PLAN_DEMO, limite)
    .all<{ id: string }>();
  let borradas = 0;
  for (const { id } of results) {
    const fotos = await db
      .prepare("select clave_objeto from fotos where tintoreria_id = ?")
      .bind(id)
      .all<{ clave_objeto: string }>();
    for (const f of fotos.results) {
      try {
        await env.BUCKET.delete(f.clave_objeto);
      } catch (e) {
        console.error("[demo] no se pudo borrar la foto", f.clave_objeto, e);
      }
    }
    await db.batch([
      ...TABLAS_DEMO.map((t) => db.prepare(`delete from ${t} where tintoreria_id = ?`).bind(id)),
      db.prepare("delete from tintorerias where id = ?").bind(id),
    ]);
    borradas++;
  }
  return borradas;
}
