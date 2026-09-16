import { sumarDiasFecha } from "@/lib/fechas";

export interface ReporteVentas {
  desde: string;
  hasta: string;
  cobradoCents: number;
  pagos: number;
  ordenes: number;
  vendidoCents: number;
  ticketPromedioCents: number;
  descuentosCents: number;
  anuladas: number;
  porDia: { fecha: string; cobradoCents: number; ordenes: number }[];
  porMetodo: { metodo: string; cents: number; pagos: number }[];
  porServicio: { servicioEs: string; servicioEn: string | null; cents: number; piezas: number }[];
  porEmpleado: {
    usuarioId: string;
    nombre: string;
    cobradoCents: number;
    pagos: number;
    ordenes: number;
    descuentosCents: number;
    anuladas: number;
  }[];
}

/** Todas las fechas del rango (AAAA-MM-DD), para que los días sin ventas aparezcan en cero. */
export function fechasDelRango(desde: string, hasta: string, max = 370): string[] {
  const salida: string[] = [];
  let f = desde;
  while (f <= hasta && salida.length < max) {
    salida.push(f);
    f = sumarDiasFecha(f, 1);
  }
  return salida;
}

export async function reporteVentas(
  db: D1Database,
  tintoreriaId: string,
  desde: string,
  hasta: string,
): Promise<ReporteVentas> {
  const [cobros, ordenes, metodos, servicios, empleadosPagos, empleadosOrdenes] = await db.batch([
    db
      .prepare(
        `select fecha_local, coalesce(sum(monto_cents), 0) as cents, count(*) as n from pagos
         where tintoreria_id = ? and anulado_en is null and fecha_local between ? and ? group by fecha_local`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select fecha_local, count(*) as n, coalesce(sum(total_cents), 0) as total, coalesce(sum(descuento_cents), 0) as descuentos,
           sum(case when estado = 'anulada' then 1 else 0 end) as anuladas
         from ordenes where tintoreria_id = ? and fecha_local between ? and ? group by fecha_local`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select metodo, coalesce(sum(monto_cents), 0) as cents, count(*) as n from pagos
         where tintoreria_id = ? and anulado_en is null and fecha_local between ? and ? group by metodo order by cents desc`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select p.servicio_es, p.servicio_en, coalesce(sum(p.total_cents), 0) as cents, count(*) as piezas
         from orden_prendas p join ordenes o on o.id = p.orden_id and o.tintoreria_id = p.tintoreria_id
         where p.tintoreria_id = ? and o.estado != 'anulada' and p.estado != 'anulada' and o.fecha_local between ? and ?
         group by p.servicio_es, p.servicio_en order by cents desc`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select p.usuario_id, u.nombre, coalesce(sum(p.monto_cents), 0) as cents, count(*) as n
         from pagos p left join usuarios u on u.id = p.usuario_id and u.tintoreria_id = p.tintoreria_id
         where p.tintoreria_id = ? and p.anulado_en is null and p.fecha_local between ? and ? group by p.usuario_id`,
      )
      .bind(tintoreriaId, desde, hasta),
    db
      .prepare(
        `select o.creada_por as usuario_id, u.nombre, count(*) as n, coalesce(sum(o.descuento_cents), 0) as descuentos,
           sum(case when o.estado = 'anulada' then 1 else 0 end) as anuladas
         from ordenes o left join usuarios u on u.id = o.creada_por and u.tintoreria_id = o.tintoreria_id
         where o.tintoreria_id = ? and o.fecha_local between ? and ? group by o.creada_por`,
      )
      .bind(tintoreriaId, desde, hasta),
  ]);
  type C = { fecha_local: string; cents: number; n: number };
  type O = { fecha_local: string; n: number; total: number; descuentos: number; anuladas: number };
  const cobrosPorDia = new Map(((cobros?.results ?? []) as C[]).map((r) => [r.fecha_local, r]));
  const ordenesPorDia = new Map(((ordenes?.results ?? []) as O[]).map((r) => [r.fecha_local, r]));
  const ords = [...ordenesPorDia.values()];
  const totalOrdenes = ords.reduce((a, r) => a + r.n, 0);
  const anuladas = ords.reduce((a, r) => a + r.anuladas, 0);
  const vendido = ords.reduce((a, r) => a + r.total, 0);
  const cobrado = [...cobrosPorDia.values()].reduce((a, r) => a + r.cents, 0);

  const empleados = new Map<string, ReporteVentas["porEmpleado"][number]>();
  const empleado = (id: string, nombre: string | null) => {
    let e = empleados.get(id);
    if (!e) {
      e = {
        usuarioId: id,
        nombre: nombre ?? "—",
        cobradoCents: 0,
        pagos: 0,
        ordenes: 0,
        descuentosCents: 0,
        anuladas: 0,
      };
      empleados.set(id, e);
    }
    return e;
  };
  for (const r of (empleadosPagos?.results ?? []) as {
    usuario_id: string;
    nombre: string | null;
    cents: number;
    n: number;
  }[]) {
    const e = empleado(r.usuario_id, r.nombre);
    e.cobradoCents = r.cents;
    e.pagos = r.n;
  }
  for (const r of (empleadosOrdenes?.results ?? []) as {
    usuario_id: string;
    nombre: string | null;
    n: number;
    descuentos: number;
    anuladas: number;
  }[]) {
    const e = empleado(r.usuario_id, r.nombre);
    e.ordenes = r.n;
    e.descuentosCents = r.descuentos;
    e.anuladas = r.anuladas;
  }

  return {
    desde,
    hasta,
    cobradoCents: cobrado,
    pagos: [...cobrosPorDia.values()].reduce((a, r) => a + r.n, 0),
    ordenes: totalOrdenes,
    vendidoCents: vendido,
    ticketPromedioCents: totalOrdenes - anuladas > 0 ? Math.round(vendido / (totalOrdenes - anuladas)) : 0,
    descuentosCents: ords.reduce((a, r) => a + r.descuentos, 0),
    anuladas,
    porDia: fechasDelRango(desde, hasta).map((f) => ({
      fecha: f,
      cobradoCents: cobrosPorDia.get(f)?.cents ?? 0,
      ordenes: ordenesPorDia.get(f)?.n ?? 0,
    })),
    porMetodo: ((metodos?.results ?? []) as { metodo: string; cents: number; n: number }[]).map((r) => ({
      metodo: r.metodo,
      cents: r.cents,
      pagos: r.n,
    })),
    porServicio: (
      (servicios?.results ?? []) as {
        servicio_es: string;
        servicio_en: string | null;
        cents: number;
        piezas: number;
      }[]
    ).map((r) => ({
      servicioEs: r.servicio_es,
      servicioEn: r.servicio_en,
      cents: r.cents,
      piezas: r.piezas,
    })),
    porEmpleado: [...empleados.values()].sort((a, b) => b.cobradoCents - a.cobradoCents),
  };
}

export interface ReporteOperacion {
  atrasadas: { id: string; numero: number; cliente: string; fechaPromesa: number }[];
  sinRecoger: {
    id: string;
    numero: number;
    cliente: string;
    listaEn: number;
    recordatorios: number;
    saldoCents: number;
  }[];
  paraAbandono: { id: string; numero: number; cliente: string; listaEn: number }[];
}

export async function reporteOperacion(
  db: D1Database,
  tintoreriaId: string,
  ahora = Date.now(),
): Promise<ReporteOperacion> {
  const [a, s, p] = await db.batch([
    db
      .prepare(
        `select o.id, o.numero, c.nombre || coalesce(' ' || c.apellido, '') as cliente, o.fecha_promesa
         from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
         where o.tintoreria_id = ? and o.estado in ('recibida', 'en_proceso') and o.fecha_promesa < ? order by o.fecha_promesa limit 100`,
      )
      .bind(tintoreriaId, ahora),
    db
      .prepare(
        `select o.id, o.numero, c.nombre || coalesce(' ' || c.apellido, '') as cliente, o.lista_en, o.recordatorios_enviados, o.total_cents - o.pagado_cents as saldo
         from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
         join tintorerias t on t.id = o.tintoreria_id
         where o.tintoreria_id = ? and o.estado = 'lista' and o.lista_en < ? - t.dias_recordatorio * 86400000 order by o.lista_en limit 100`,
      )
      .bind(tintoreriaId, ahora),
    db
      .prepare(
        `select o.id, o.numero, c.nombre || coalesce(' ' || c.apellido, '') as cliente, o.lista_en
         from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
         join tintorerias t on t.id = o.tintoreria_id
         where o.tintoreria_id = ? and o.estado = 'lista' and o.lista_en < ? - t.dias_abandono * 86400000 order by o.lista_en limit 100`,
      )
      .bind(tintoreriaId, ahora),
  ]);
  return {
    atrasadas: (
      (a?.results ?? []) as { id: string; numero: number; cliente: string; fecha_promesa: number }[]
    ).map((r) => ({ id: r.id, numero: r.numero, cliente: r.cliente, fechaPromesa: r.fecha_promesa })),
    sinRecoger: (
      (s?.results ?? []) as {
        id: string;
        numero: number;
        cliente: string;
        lista_en: number;
        recordatorios_enviados: number;
        saldo: number;
      }[]
    ).map((r) => ({
      id: r.id,
      numero: r.numero,
      cliente: r.cliente,
      listaEn: r.lista_en,
      recordatorios: r.recordatorios_enviados,
      saldoCents: r.saldo,
    })),
    paraAbandono: (
      (p?.results ?? []) as { id: string; numero: number; cliente: string; lista_en: number }[]
    ).map((r) => ({ id: r.id, numero: r.numero, cliente: r.cliente, listaEn: r.lista_en })),
  };
}

/** Días de un rango en la zona de la tienda (para los atajos «hoy», «7 días»…). */
export function rangoPreset(preset: string, hoy: string): [string, string] {
  switch (preset) {
    case "ayer":
      return [sumarDiasFecha(hoy, -1), sumarDiasFecha(hoy, -1)];
    case "7":
      return [sumarDiasFecha(hoy, -6), hoy];
    case "30":
      return [sumarDiasFecha(hoy, -29), hoy];
    case "mes":
      return [`${hoy.slice(0, 7)}-01`, hoy];
    default:
      return [hoy, hoy];
  }
}
