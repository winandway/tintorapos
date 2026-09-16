import { esCodigoValido } from "@/lib/codigos";
import { diaSemana } from "@/lib/fechas";

export interface OrdenPublica {
  numero: number;
  estado: string;
  fechaPromesa: number;
  listaEn: number | null;
  entregadaEn: number | null;
  piezas: number;
  listas: number;
  tieneSaldo: boolean;
  dia: number;
  primerNombre: string;
  idiomaCliente: "es" | "en";
  tienda: {
    nombre: string;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    zona: string;
    pais: string;
  };
}

/**
 * Lo único que ve alguien con el enlace del recibo: estado, fechas, número y el
 * PRIMER nombre. Nunca teléfono, dirección del cliente ni importes.
 */
export async function ordenPublica(db: D1Database, codigo: string): Promise<OrdenPublica | null> {
  const limpio = codigo.toUpperCase();
  if (!esCodigoValido(limpio, 20)) return null;
  const f = await db
    .prepare(
      `select o.numero, o.estado, o.fecha_promesa, o.lista_en, o.entregada_en, o.total_cents, o.pagado_cents, o.creada_en,
         c.nombre as c_nombre, c.idioma as c_idioma,
         t.nombre as t_nombre, t.telefono as t_telefono, t.direccion as t_direccion, t.ciudad as t_ciudad, t.zona_horaria as t_zona, t.pais as t_pais,
         (select count(*) from orden_prendas p where p.tintoreria_id = o.tintoreria_id and p.orden_id = o.id and p.estado != 'anulada') as piezas,
         (select count(*) from orden_prendas p where p.tintoreria_id = o.tintoreria_id and p.orden_id = o.id and p.estado in ('lista', 'entregada')) as listas
       from ordenes o
       join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
       join tintorerias t on t.id = o.tintoreria_id
       /* código público: enlace del recibo */ where o.codigo_publico = ?`,
    )
    .bind(limpio)
    .first<{
      numero: number;
      estado: string;
      fecha_promesa: number;
      lista_en: number | null;
      entregada_en: number | null;
      total_cents: number;
      pagado_cents: number;
      creada_en: number;
      c_nombre: string;
      c_idioma: "es" | "en";
      t_nombre: string;
      t_telefono: string | null;
      t_direccion: string | null;
      t_ciudad: string | null;
      t_zona: string;
      t_pais: string;
      piezas: number;
      listas: number;
    }>();
  if (!f) return null;
  return {
    numero: f.numero,
    estado: f.estado,
    fechaPromesa: f.fecha_promesa,
    listaEn: f.lista_en,
    entregadaEn: f.entregada_en,
    piezas: f.piezas,
    listas: f.listas,
    tieneSaldo: f.total_cents > f.pagado_cents && f.estado !== "anulada",
    dia: diaSemana(f.creada_en, f.t_zona),
    primerNombre: (f.c_nombre ?? "").trim().split(/\s+/)[0] ?? "",
    idiomaCliente: f.c_idioma,
    tienda: {
      nombre: f.t_nombre,
      telefono: f.t_telefono,
      direccion: f.t_direccion,
      ciudad: f.t_ciudad,
      zona: f.t_zona,
      pais: f.t_pais,
    },
  };
}

/** Código de la etiqueta de una prenda → código público de su orden. */
export async function codigoDeEtiqueta(db: D1Database, codigo: string): Promise<string | null> {
  const limpio = codigo.toUpperCase();
  if (!esCodigoValido(limpio, 12)) return null;
  const f = await db
    .prepare(
      `select o.codigo_publico from orden_prendas p join ordenes o on o.id = p.orden_id and o.tintoreria_id = p.tintoreria_id
       /* código público: etiqueta de prenda */ where p.codigo_etiqueta = ?`,
    )
    .bind(limpio)
    .first<{ codigo_publico: string }>();
  return f?.codigo_publico ?? null;
}
