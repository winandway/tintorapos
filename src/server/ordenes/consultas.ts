import { extraerCodigo } from "@/lib/codigos";
import { diaSemana } from "@/lib/fechas";
import { noEncontrado } from "@/server/errores";

export const ESTADOS = ["recibida", "en_proceso", "lista", "entregada", "anulada", "abandonada"] as const;
export type Estado = (typeof ESTADOS)[number];
export const ESTADOS_ABIERTOS: Estado[] = ["recibida", "en_proceso", "lista"];

export interface PrendaOrden {
  id: string;
  prendaEs: string;
  prendaEn: string | null;
  servicioEs: string;
  servicioEn: string | null;
  unidad: "pieza" | "libra";
  cantidad: number;
  precioUnitCents: number;
  totalCents: number;
  color: string | null;
  marca: string | null;
  notas: string | null;
  codigoEtiqueta: string;
  estado: Estado;
  ubicacion: string | null;
  posicion: number;
}

export interface Orden {
  id: string;
  numero: number;
  codigoPublico: string;
  estado: Estado;
  urgente: boolean;
  fechaPromesa: number;
  atrasada: boolean;
  dia: number;
  notas: string | null;
  subtotalCents: number;
  recargoCents: number;
  descuentoCents: number;
  descuentoMotivo: string | null;
  impuestoCents: number;
  totalCents: number;
  pagadoCents: number;
  saldoCents: number;
  impuestoBps: number;
  recargoBps: number;
  creadaEn: number;
  listaEn: number | null;
  entregadaEn: number | null;
  anuladaEn: number | null;
  anuladaMotivo: string | null;
  origen: string;
  creadaPor: string | null;
  cliente: {
    id: string;
    nombre: string;
    apellido: string | null;
    telefono: string | null;
    idioma: "es" | "en";
    preferencias: string;
  };
  prendas: PrendaOrden[];
  pagos: {
    id: string;
    metodo: string;
    montoCents: number;
    referencia: string | null;
    usuario: string | null;
    creadoEn: number;
    anuladoEn: number | null;
    anuladoMotivo: string | null;
  }[];
  historial: {
    estadoAnterior: string | null;
    estadoNuevo: string;
    ubicacion: string | null;
    usuario: string | null;
    prendaId: string | null;
    creadoEn: number;
  }[];
  fotos: { id: string; prendaId: string | null }[];
}

interface FilaOrden {
  id: string;
  numero: number;
  codigo_publico: string;
  estado: Estado;
  urgente: number;
  fecha_promesa: number;
  notas: string | null;
  subtotal_cents: number;
  recargo_cents: number;
  descuento_cents: number;
  descuento_motivo: string | null;
  impuesto_cents: number;
  total_cents: number;
  pagado_cents: number;
  impuesto_bps: number;
  recargo_bps: number;
  creada_en: number;
  lista_en: number | null;
  entregada_en: number | null;
  anulada_en: number | null;
  anulada_motivo: string | null;
  origen: string;
  creada_por_nombre: string | null;
  cliente_id: string;
  c_nombre: string;
  c_apellido: string | null;
  c_telefono: string | null;
  c_idioma: "es" | "en";
  c_preferencias: string;
  zona: string;
}

export function estaAtrasada(estado: string, fechaPromesa: number, ahora = Date.now()): boolean {
  return (estado === "recibida" || estado === "en_proceso") && fechaPromesa < ahora;
}

export async function verOrden(
  db: D1Database,
  tintoreriaId: string,
  id: string,
  ahora = Date.now(),
): Promise<Orden> {
  const [o, p, pg, h, f] = await db.batch([
    db
      .prepare(
        `select o.*, u.nombre as creada_por_nombre, c.nombre as c_nombre, c.apellido as c_apellido, c.telefono as c_telefono,
           c.idioma as c_idioma, c.preferencias as c_preferencias, t.zona_horaria as zona
         from ordenes o
         join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
         join tintorerias t on t.id = o.tintoreria_id
         left join usuarios u on u.id = o.creada_por and u.tintoreria_id = o.tintoreria_id
         where o.tintoreria_id = ? and o.id = ?`,
      )
      .bind(tintoreriaId, id),
    db
      .prepare("select * from orden_prendas where tintoreria_id = ? and orden_id = ? order by posicion")
      .bind(tintoreriaId, id),
    db
      .prepare(
        `select p.id, p.metodo, p.monto_cents, p.referencia, p.creado_en, p.anulado_en, p.anulado_motivo, u.nombre as usuario
         from pagos p left join usuarios u on u.id = p.usuario_id and u.tintoreria_id = p.tintoreria_id
         where p.tintoreria_id = ? and p.orden_id = ? order by p.creado_en`,
      )
      .bind(tintoreriaId, id),
    db
      .prepare(
        `select e.estado_anterior, e.estado_nuevo, e.ubicacion, e.prenda_id, e.creado_en, u.nombre as usuario
         from orden_estados e left join usuarios u on u.id = e.usuario_id and u.tintoreria_id = e.tintoreria_id
         where e.tintoreria_id = ? and e.orden_id = ? order by e.creado_en`,
      )
      .bind(tintoreriaId, id),
    db
      .prepare("select id, prenda_id from fotos where tintoreria_id = ? and orden_id = ? order by creado_en")
      .bind(tintoreriaId, id),
  ]);
  const fila = (o?.results as FilaOrden[] | undefined)?.[0];
  if (!fila) throw noEncontrado();
  type FP = {
    id: string;
    prenda_es: string;
    prenda_en: string | null;
    servicio_es: string;
    servicio_en: string | null;
    unidad: "pieza" | "libra";
    cantidad: number;
    precio_unit_cents: number;
    total_cents: number;
    color: string | null;
    marca: string | null;
    notas: string | null;
    codigo_etiqueta: string;
    estado: Estado;
    ubicacion: string | null;
    posicion: number;
  };
  return {
    id: fila.id,
    numero: fila.numero,
    codigoPublico: fila.codigo_publico,
    estado: fila.estado,
    urgente: fila.urgente === 1,
    fechaPromesa: fila.fecha_promesa,
    atrasada: estaAtrasada(fila.estado, fila.fecha_promesa, ahora),
    dia: diaSemana(fila.creada_en, fila.zona),
    notas: fila.notas,
    subtotalCents: fila.subtotal_cents,
    recargoCents: fila.recargo_cents,
    descuentoCents: fila.descuento_cents,
    descuentoMotivo: fila.descuento_motivo,
    impuestoCents: fila.impuesto_cents,
    totalCents: fila.total_cents,
    pagadoCents: fila.pagado_cents,
    saldoCents: Math.max(0, fila.total_cents - fila.pagado_cents),
    impuestoBps: fila.impuesto_bps,
    recargoBps: fila.recargo_bps,
    creadaEn: fila.creada_en,
    listaEn: fila.lista_en,
    entregadaEn: fila.entregada_en,
    anuladaEn: fila.anulada_en,
    anuladaMotivo: fila.anulada_motivo,
    origen: fila.origen,
    creadaPor: fila.creada_por_nombre,
    cliente: {
      id: fila.cliente_id,
      nombre: fila.c_nombre,
      apellido: fila.c_apellido,
      telefono: fila.c_telefono,
      idioma: fila.c_idioma,
      preferencias: fila.c_preferencias,
    },
    prendas: ((p?.results ?? []) as FP[]).map((x) => ({
      id: x.id,
      prendaEs: x.prenda_es,
      prendaEn: x.prenda_en,
      servicioEs: x.servicio_es,
      servicioEn: x.servicio_en,
      unidad: x.unidad,
      cantidad: x.cantidad,
      precioUnitCents: x.precio_unit_cents,
      totalCents: x.total_cents,
      color: x.color,
      marca: x.marca,
      notas: x.notas,
      codigoEtiqueta: x.codigo_etiqueta,
      estado: x.estado,
      ubicacion: x.ubicacion,
      posicion: x.posicion,
    })),
    pagos: (
      (pg?.results ?? []) as {
        id: string;
        metodo: string;
        monto_cents: number;
        referencia: string | null;
        creado_en: number;
        anulado_en: number | null;
        anulado_motivo: string | null;
        usuario: string | null;
      }[]
    ).map((x) => ({
      id: x.id,
      metodo: x.metodo,
      montoCents: x.monto_cents,
      referencia: x.referencia,
      usuario: x.usuario,
      creadoEn: x.creado_en,
      anuladoEn: x.anulado_en,
      anuladoMotivo: x.anulado_motivo,
    })),
    historial: (
      (h?.results ?? []) as {
        estado_anterior: string | null;
        estado_nuevo: string;
        ubicacion: string | null;
        prenda_id: string | null;
        creado_en: number;
        usuario: string | null;
      }[]
    ).map((x) => ({
      estadoAnterior: x.estado_anterior,
      estadoNuevo: x.estado_nuevo,
      ubicacion: x.ubicacion,
      usuario: x.usuario,
      prendaId: x.prenda_id,
      creadoEn: x.creado_en,
    })),
    fotos: ((f?.results ?? []) as { id: string; prenda_id: string | null }[]).map((x) => ({
      id: x.id,
      prendaId: x.prenda_id,
    })),
  };
}

/** Sin montos: para quien no tiene permiso de verlos (planta). */
export function sinMontos(o: Orden): Omit<Orden, "pagos"> & { pagos: [] } {
  return {
    ...o,
    subtotalCents: 0,
    recargoCents: 0,
    descuentoCents: 0,
    impuestoCents: 0,
    totalCents: 0,
    pagadoCents: 0,
    saldoCents: 0,
    prendas: o.prendas.map((p) => ({ ...p, precioUnitCents: 0, totalCents: 0 })),
    pagos: [],
  };
}

export interface FiltroOrdenes {
  estado?: Estado | "abiertas" | "atrasadas" | "todas";
  q?: string;
  desde?: string;
  hasta?: string;
  limite?: number;
  antesDe?: number;
}

export interface OrdenLista {
  id: string;
  numero: number;
  estado: Estado;
  urgente: boolean;
  fechaPromesa: number;
  atrasada: boolean;
  dia: number;
  totalCents: number;
  saldoCents: number;
  piezas: number;
  listas: number;
  cliente: string;
  telefono: string | null;
  creadaEn: number;
}

export async function listarOrdenes(
  db: D1Database,
  tintoreriaId: string,
  zona: string,
  f: FiltroOrdenes,
  ahora = Date.now(),
): Promise<OrdenLista[]> {
  const condiciones = ["o.tintoreria_id = ?"];
  const valores: (string | number)[] = [tintoreriaId];
  const estado = f.estado ?? "abiertas";
  if (estado === "abiertas") condiciones.push("o.estado in ('recibida', 'en_proceso', 'lista')");
  else if (estado === "atrasadas") {
    condiciones.push("o.estado in ('recibida', 'en_proceso') and o.fecha_promesa < ?");
    valores.push(ahora);
  } else if (estado !== "todas") {
    condiciones.push("o.estado = ?");
    valores.push(estado);
  }
  const q = (f.q ?? "").trim().replace(/^#/, "");
  if (q) {
    const digitos = q.replace(/\D/g, "");
    if (/^\d{1,9}$/.test(q)) {
      condiciones.push("(o.numero = ? or c.telefono_digitos like ?)");
      valores.push(Number(q), `%${digitos}%`);
    } else if (digitos.length >= 7) {
      condiciones.push("c.telefono_digitos like ?");
      valores.push(`%${digitos}%`);
    } else {
      condiciones.push(
        "(c.nombre like ? or c.apellido like ? or (c.nombre || ' ' || coalesce(c.apellido, '')) like ?)",
      );
      const patron = `%${q.replace(/[%_]/g, "")}%`;
      valores.push(patron, patron, patron);
    }
  }
  if (f.desde) {
    condiciones.push("o.fecha_local >= ?");
    valores.push(f.desde);
  }
  if (f.hasta) {
    condiciones.push("o.fecha_local <= ?");
    valores.push(f.hasta);
  }
  if (f.antesDe) {
    condiciones.push("o.creada_en < ?");
    valores.push(f.antesDe);
  }
  const orden = estado === "abiertas" || estado === "atrasadas" ? "o.fecha_promesa asc" : "o.creada_en desc";
  const { results } = await db
    .prepare(
      `select o.id, o.numero, o.estado, o.urgente, o.fecha_promesa, o.total_cents, o.pagado_cents, o.creada_en,
         c.nombre || coalesce(' ' || c.apellido, '') as cliente, c.telefono,
         (select count(*) from orden_prendas p where p.tintoreria_id = o.tintoreria_id and p.orden_id = o.id and p.estado != 'anulada') as piezas,
         (select count(*) from orden_prendas p where p.tintoreria_id = o.tintoreria_id and p.orden_id = o.id and p.estado = 'lista') as listas
       from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
       where ${condiciones.join(" and ")}
       order by ${orden} limit ?`,
    )
    .bind(...valores, Math.min(200, f.limite ?? 50))
    .all<{
      id: string;
      numero: number;
      estado: Estado;
      urgente: number;
      fecha_promesa: number;
      total_cents: number;
      pagado_cents: number;
      creada_en: number;
      cliente: string;
      telefono: string | null;
      piezas: number;
      listas: number;
    }>();
  return results.map((r) => ({
    id: r.id,
    numero: r.numero,
    estado: r.estado,
    urgente: r.urgente === 1,
    fechaPromesa: r.fecha_promesa,
    atrasada: estaAtrasada(r.estado, r.fecha_promesa, ahora),
    dia: diaSemana(r.creada_en, zona),
    totalCents: r.total_cents,
    saldoCents: Math.max(0, r.total_cents - r.pagado_cents),
    piezas: r.piezas,
    listas: r.listas,
    cliente: r.cliente,
    telefono: r.telefono,
    creadaEn: r.creada_en,
  }));
}

/** Lo que manda el lector (código del ticket o de la etiqueta de una prenda) → orden y prenda. */
export async function buscarPorCodigo(
  db: D1Database,
  tintoreriaId: string,
  texto: string,
): Promise<{ ordenId: string; prendaId: string | null } | null> {
  const codigo = extraerCodigo(texto);
  if (!codigo) {
    const numero = texto.trim().replace(/^#/, "");
    if (/^\d{1,9}$/.test(numero)) {
      const o = await db
        .prepare("select id from ordenes where tintoreria_id = ? and numero = ?")
        .bind(tintoreriaId, Number(numero))
        .first<{ id: string }>();
      return o ? { ordenId: o.id, prendaId: null } : null;
    }
    return null;
  }
  if (codigo.length === 20) {
    const o = await db
      .prepare("select id from ordenes where tintoreria_id = ? and codigo_publico = ?")
      .bind(tintoreriaId, codigo)
      .first<{ id: string }>();
    return o ? { ordenId: o.id, prendaId: null } : null;
  }
  const p = await db
    .prepare("select id, orden_id from orden_prendas where tintoreria_id = ? and codigo_etiqueta = ?")
    .bind(tintoreriaId, codigo)
    .first<{ id: string; orden_id: string }>();
  return p ? { ordenId: p.orden_id, prendaId: p.id } : null;
}
