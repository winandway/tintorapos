/**
 * El panel de Windoce: el negocio completo de un vistazo. Es la ÚNICA parte
 * del sistema que mira todas las tintorerías a la vez, y por eso cada consulta
 * va marcada como global y la puerta la cuida `esAdmin()` en la ruta.
 */
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { PLAN_DEMO } from "@/server/demo";
import { ErrorApp, noEncontrado } from "@/server/errores";
import { ticketsAbiertos } from "@/server/soporte/tickets";

export interface ResumenAdmin {
  cuentas: {
    total: number;
    enPrueba: number;
    pagando: number;
    vencidas: number;
    suspendidas: number;
    nuevas7: number;
    nuevas30: number;
  };
  demos: { vivos: number; hoy: number };
  uso: { usuarios: number; ordenes30: number; ordenesTotal: number; tintoreriasActivas7: number };
  dinero: { registrado30Cents: number; registradoTotalCents: number; porCobrarCents: number };
  soporte: { ticketsAbiertos: number };
  porDia: { fecha: string; cuentas: number }[];
}

const DIA = 86_400_000;

export async function resumenAdmin(db: D1Database, ahora = Date.now()): Promise<ResumenAdmin> {
  const hace7 = ahora - 7 * DIA;
  const hace30 = ahora - 30 * DIA;
  const [cuentas, demos, uso, dinero, dias] = await db.batch([
    db
      .prepare(
        `select
           sum(case when plan <> ?1 then 1 else 0 end) as total,
           sum(case when plan = 'prueba' and (prueba_hasta is null or prueba_hasta > ?2) then 1 else 0 end) as en_prueba,
           sum(case when plan not in ('prueba', ?1) then 1 else 0 end) as pagando,
           sum(case when plan = 'prueba' and prueba_hasta is not null and prueba_hasta <= ?2 then 1 else 0 end) as vencidas,
           sum(case when estado = 'suspendida' and plan <> ?1 then 1 else 0 end) as suspendidas,
           sum(case when creada_en >= ?3 and plan <> ?1 then 1 else 0 end) as nuevas7,
           sum(case when creada_en >= ?4 and plan <> ?1 then 1 else 0 end) as nuevas30
         from tintorerias /* global: el panel de Windoce mira todas */`,
      )
      .bind(PLAN_DEMO, ahora, hace7, hace30),
    db
      .prepare(
        `select count(*) as vivos, sum(case when creada_en >= ?2 then 1 else 0 end) as hoy
         from tintorerias /* global: panel de Windoce */ where plan = ?1`,
      )
      .bind(PLAN_DEMO, ahora - DIA),
    db
      .prepare(
        `select
           (select count(*) from usuarios u join tintorerias t on t.id = u.tintoreria_id where t.plan <> ?1) as usuarios,
           (select count(*) from ordenes o join tintorerias t on t.id = o.tintoreria_id where t.plan <> ?1 and o.creada_en >= ?2) as ordenes30,
           (select count(*) from ordenes o join tintorerias t on t.id = o.tintoreria_id where t.plan <> ?1) as ordenes_total,
           (select count(distinct o.tintoreria_id) from ordenes o join tintorerias t on t.id = o.tintoreria_id where t.plan <> ?1 and o.creada_en >= ?3) as activas7
         /* global: panel de Windoce */`,
      )
      .bind(PLAN_DEMO, hace30, hace7),
    db
      .prepare(
        `select
           (select coalesce(sum(p.monto_cents), 0) from pagos p join tintorerias t on t.id = p.tintoreria_id
              where t.plan <> ?1 and p.anulado_en is null and p.creado_en >= ?2) as mes,
           (select coalesce(sum(p.monto_cents), 0) from pagos p join tintorerias t on t.id = p.tintoreria_id
              where t.plan <> ?1 and p.anulado_en is null) as total,
           (select coalesce(sum(o.total_cents - o.pagado_cents), 0) from ordenes o join tintorerias t on t.id = o.tintoreria_id
              where t.plan <> ?1 and o.estado <> 'anulada' and o.total_cents > o.pagado_cents) as por_cobrar
         /* global: panel de Windoce */`,
      )
      .bind(PLAN_DEMO, hace30),
    db
      .prepare(
        `select date(creada_en / 1000, 'unixepoch') as fecha, count(*) as n
         from tintorerias /* global: panel de Windoce */
         where plan <> ?1 and creada_en >= ?2 group by fecha order by fecha`,
      )
      .bind(PLAN_DEMO, hace30),
  ]);
  const c = ((cuentas?.results ?? [])[0] ?? {}) as Record<string, number | null>;
  const de = ((demos?.results ?? [])[0] ?? {}) as Record<string, number | null>;
  const u = ((uso?.results ?? [])[0] ?? {}) as Record<string, number | null>;
  const di = ((dinero?.results ?? [])[0] ?? {}) as Record<string, number | null>;
  return {
    cuentas: {
      total: c.total ?? 0,
      enPrueba: c.en_prueba ?? 0,
      pagando: c.pagando ?? 0,
      vencidas: c.vencidas ?? 0,
      suspendidas: c.suspendidas ?? 0,
      nuevas7: c.nuevas7 ?? 0,
      nuevas30: c.nuevas30 ?? 0,
    },
    demos: { vivos: de.vivos ?? 0, hoy: de.hoy ?? 0 },
    uso: {
      usuarios: u.usuarios ?? 0,
      ordenes30: u.ordenes30 ?? 0,
      ordenesTotal: u.ordenes_total ?? 0,
      tintoreriasActivas7: u.activas7 ?? 0,
    },
    dinero: {
      registrado30Cents: di.mes ?? 0,
      registradoTotalCents: di.total ?? 0,
      porCobrarCents: di.por_cobrar ?? 0,
    },
    soporte: { ticketsAbiertos: await ticketsAbiertos(db) },
    porDia: ((dias?.results ?? []) as { fecha: string; n: number }[]).map((d) => ({
      fecha: d.fecha,
      cuentas: d.n,
    })),
  };
}

export interface TintoreriaAdmin {
  id: string;
  nombre: string;
  correo: string | null;
  pais: string;
  moneda: string;
  plan: string;
  estado: string;
  pruebaHasta: number | null;
  /** La prueba ya se acabó (se calcula aquí para que la pantalla no mire el reloj). */
  pruebaVencida: boolean;
  creadaEn: number;
  usuarios: number;
  ordenes: number;
  cobradoCents: number;
  ultimaOrdenEn: number | null;
}

export async function listarTintorerias(
  db: D1Database,
  opciones: { q?: string; limite?: number } = {},
  ahora = Date.now(),
): Promise<TintoreriaAdmin[]> {
  const q = (opciones.q ?? "").trim().slice(0, 60).replace(/[%_]/g, "");
  const { results } = await db
    .prepare(
      `select t.id, t.nombre, t.correo, t.pais, t.moneda, t.plan, t.estado, t.prueba_hasta, t.creada_en,
         (select count(*) from usuarios u where u.tintoreria_id = t.id) as usuarios,
         (select count(*) from ordenes o where o.tintoreria_id = t.id) as ordenes,
         (select coalesce(sum(p.monto_cents), 0) from pagos p where p.tintoreria_id = t.id and p.anulado_en is null) as cobrado,
         (select max(o.creada_en) from ordenes o where o.tintoreria_id = t.id) as ultima
       from tintorerias t /* global: panel de Windoce */
       where t.plan <> ?1 and (?2 = '' or lower(t.nombre) like ?3 or lower(coalesce(t.correo, '')) like ?3)
       order by t.creada_en desc limit ?4`,
    )
    .bind(PLAN_DEMO, q.toLowerCase(), `%${q.toLowerCase()}%`, Math.min(200, opciones.limite ?? 100))
    .all<{
      id: string;
      nombre: string;
      correo: string | null;
      pais: string;
      moneda: string;
      plan: string;
      estado: string;
      prueba_hasta: number | null;
      creada_en: number;
      usuarios: number;
      ordenes: number;
      cobrado: number;
      ultima: number | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    correo: r.correo,
    pais: r.pais,
    moneda: r.moneda,
    plan: r.plan,
    estado: r.estado,
    pruebaHasta: r.prueba_hasta,
    pruebaVencida: r.plan === "prueba" && r.prueba_hasta !== null && r.prueba_hasta <= ahora,
    creadaEn: r.creada_en,
    usuarios: r.usuarios,
    ordenes: r.ordenes,
    cobradoCents: r.cobrado,
    ultimaOrdenEn: r.ultima,
  }));
}

export const PLANES_ADMIN = ["prueba", "pagado", "cortesia"] as const;
export type PlanAdmin = (typeof PLANES_ADMIN)[number];

/**
 * Cambia el plan o el estado de una tintorería. Es lo que se toca cuando
 * alguien paga los 120 del año: plan `pagado` y se acabó el bloqueo de prueba.
 */
export async function cambiarCuenta(
  db: D1Database,
  s: Sesion,
  id: string,
  cambio: { plan?: PlanAdmin; estado?: "activa" | "suspendida"; diasPrueba?: number },
  ahora = Date.now(),
): Promise<void> {
  const t = await db
    .prepare("select plan from tintorerias /* global: panel de Windoce */ where id = ?")
    .bind(id)
    .first<{ plan: string }>();
  if (!t) throw noEncontrado();
  if (t.plan === PLAN_DEMO) throw new ErrorApp(409, "no_aplica");
  const sentencias: D1PreparedStatement[] = [];
  if (cambio.plan)
    sentencias.push(
      db
        .prepare(
          "update tintorerias /* global: panel de Windoce */ set plan = ?, prueba_hasta = ?, actualizada_en = ? where id = ?",
        )
        .bind(
          cambio.plan,
          cambio.plan === "prueba" ? ahora + (cambio.diasPrueba ?? 14) * DIA : null,
          ahora,
          id,
        ),
    );
  else if (cambio.diasPrueba !== undefined)
    sentencias.push(
      db
        .prepare(
          "update tintorerias /* global: panel de Windoce */ set prueba_hasta = ?, actualizada_en = ? where id = ?",
        )
        .bind(ahora + cambio.diasPrueba * DIA, ahora, id),
    );
  if (cambio.estado)
    sentencias.push(
      db
        .prepare(
          "update tintorerias /* global: panel de Windoce */ set estado = ?, actualizada_en = ? where id = ?",
        )
        .bind(cambio.estado, ahora, id),
    );
  if (!sentencias.length) throw new ErrorApp(400, "datos_invalidos");
  // La auditoría queda en la tintorería tocada, con el nombre de quien la tocó.
  sentencias.push(
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: id,
        usuarioId: null,
        accion: "admin.cuenta_cambiada",
        entidad: "tintoreria",
        entidadId: id,
        detalle: { ...cambio, por: s.usuario.correo ?? s.usuario.nombre },
      },
      ahora,
    ),
  );
  await db.batch(sentencias);
}
