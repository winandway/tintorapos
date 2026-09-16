import { nuevoId, sha256Hex } from "@/lib/codigos";
import { fechaLocal } from "@/lib/fechas";
import type { Variables } from "@/env";
import { cifrarBytes, descifrarBytes } from "@/server/auth/cifrado";
import { ErrorApp } from "@/server/errores";

/** Tablas que forman los datos de una tintorería, en orden de dependencias (para restaurar). */
export const TABLAS_RESPALDO = [
  "tintorerias",
  "sucursales",
  "usuarios",
  "dispositivos",
  "clientes",
  "catalogo_prendas",
  "catalogo_servicios",
  "precios",
  "turnos_caja",
  "movimientos_caja",
  "ordenes",
  "orden_prendas",
  "orden_estados",
  "fotos",
  "pagos",
  "avisos",
  "auditoria",
] as const;

export type TablaRespaldo = (typeof TABLAS_RESPALDO)[number];
export const DIAS_RETENCION = 30;
const PAGINA = 500;

export interface Volcado {
  version: 1;
  tintoreriaId: string;
  creadoEn: number;
  tablas: Record<string, Record<string, unknown>[]>;
}

// Consultas fijas por tabla (nunca se arma SQL con texto que venga de afuera).
const SQL_LECTURA: Record<TablaRespaldo, string> = Object.fromEntries(
  TABLAS_RESPALDO.map((t) => [
    t,
    t === "tintorerias"
      ? "select * from tintorerias where id = ? and rowid > ? order by rowid limit ?"
      : `select rowid as _fila, * from ${t} where tintoreria_id = ? and rowid > ? order by rowid limit ?`,
  ]),
) as Record<TablaRespaldo, string>;

export async function volcarTintoreria(
  db: D1Database,
  tintoreriaId: string,
  ahora = Date.now(),
): Promise<Volcado> {
  const tablas: Volcado["tablas"] = {};
  for (const tabla of TABLAS_RESPALDO) {
    const filas: Record<string, unknown>[] = [];
    let ultimo = 0;
    for (;;) {
      const sql =
        tabla === "tintorerias"
          ? "select rowid as _fila, * from tintorerias where id = ? and rowid > ? order by rowid limit ?"
          : SQL_LECTURA[tabla];
      const { results } = await db
        .prepare(sql)
        .bind(tintoreriaId, ultimo, PAGINA)
        .all<Record<string, unknown>>();
      for (const r of results) {
        ultimo = Number(r._fila);
        const { _fila: _descartar, ...resto } = r;
        filas.push(resto);
      }
      if (results.length < PAGINA) break;
    }
    tablas[tabla] = filas;
  }
  return { version: 1, tintoreriaId, creadoEn: ahora, tablas };
}

async function comprimir(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

async function descomprimir(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

export interface InfoRespaldo {
  id: string;
  clave: string;
  bytes: number;
  filas: number;
  sha256: string;
}

/** Respaldo diario: JSON → gzip → AES-256-GCM (BACKUP_KEY) → almacén. */
export async function crearRespaldo(
  env: CloudflareEnv,
  vars: Variables,
  tintoreriaId: string,
  ahora = Date.now(),
): Promise<InfoRespaldo> {
  if (!vars.BACKUP_KEY) throw new ErrorApp(503, "configuracion");
  const volcado = await volcarTintoreria(env.DB, tintoreriaId, ahora);
  const filas = Object.values(volcado.tablas).reduce((n, t) => n + t.length, 0);
  const cifrado = await cifrarBytes(
    vars.BACKUP_KEY,
    await comprimir(new TextEncoder().encode(JSON.stringify(volcado))),
  );
  const id = nuevoId();
  const zona = (volcado.tablas.tintorerias?.[0]?.zona_horaria as string | undefined) ?? "UTC";
  const clave = `respaldos/${tintoreriaId}/${fechaLocal(ahora, zona)}-${id}.json.gz.enc`;
  const sha = await sha256Hex(cifrado);
  await env.BUCKET.put(clave, cifrado, {
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: { sha256: sha },
  });
  await env.DB.prepare(
    "insert into respaldos (id, tintoreria_id, clave_objeto, bytes, filas, sha256, creado_en) values (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, tintoreriaId, clave, cifrado.length, filas, sha, ahora)
    .run();
  return { id, clave, bytes: cifrado.length, filas, sha256: sha };
}

export async function leerRespaldo(env: CloudflareEnv, vars: Variables, clave: string): Promise<Volcado> {
  if (!vars.BACKUP_KEY) throw new ErrorApp(503, "configuracion");
  const objeto = await env.BUCKET.get(clave);
  if (!objeto) throw new ErrorApp(404, "no_encontrado");
  const cifrado = new Uint8Array(await objeto.arrayBuffer());
  const esperado = objeto.customMetadata?.sha256;
  if (esperado && (await sha256Hex(cifrado)) !== esperado) throw new ErrorApp(500, "inesperado");
  const plano = await descomprimir(await descifrarBytes(vars.BACKUP_KEY, cifrado));
  return JSON.parse(new TextDecoder().decode(plano)) as Volcado;
}

/**
 * Carga un volcado en una base VACÍA (restauración de emergencia o prueba de
 * restauración). Inserta por lotes respetando el orden de dependencias.
 */
export async function restaurarEnBase(db: D1Database, v: Volcado): Promise<number> {
  let total = 0;
  for (const tabla of TABLAS_RESPALDO) {
    const filas = v.tablas[tabla] ?? [];
    for (let i = 0; i < filas.length; i += 20) {
      const lote = filas.slice(i, i + 20).map((f) => {
        const columnas = Object.keys(f).filter((c) => /^[a-z_]+$/.test(c));
        return db
          .prepare(
            `insert into ${tabla} (${columnas.join(", ")}) values (${columnas.map(() => "?").join(", ")})`,
          )
          .bind(...columnas.map((c) => f[c] as string | number | null));
      });
      await db.batch(lote);
      total += lote.length;
    }
  }
  return total;
}

export async function limpiarRespaldosViejos(env: CloudflareEnv, ahora = Date.now()): Promise<number> {
  const { results } = await env.DB.prepare(
    "select id, tintoreria_id, clave_objeto from respaldos /* sistema: retención de respaldos */ where borrado_en is null and creado_en < ? limit 200",
  )
    .bind(ahora - DIAS_RETENCION * 86_400_000)
    .all<{ id: string; tintoreria_id: string; clave_objeto: string }>();
  for (const r of results) {
    await env.BUCKET.delete(r.clave_objeto);
    await env.DB.prepare("update respaldos set borrado_en = ? where tintoreria_id = ? and id = ?")
      .bind(ahora, r.tintoreria_id, r.id)
      .run();
  }
  return results.length;
}

/** Tintorerías activas cuyo último respaldo tiene más de 24 horas. */
export async function tintoreriasPorRespaldar(
  db: D1Database,
  ahora = Date.now(),
  limite = 3,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      `select t.id from tintorerias t /* sistema: respaldos pendientes */
       where t.estado = 'activa'
         and coalesce((select max(r.creado_en) from respaldos r where r.tintoreria_id = t.id), 0) < ?
       order by coalesce((select max(r.creado_en) from respaldos r where r.tintoreria_id = t.id), 0)
       limit ?`,
    )
    .bind(ahora - 24 * 3600_000, limite)
    .all<{ id: string }>();
  return results.map((r) => r.id);
}

function celdaCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Evita fórmulas al abrir el CSV en Excel o Google Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNAS_CSV = {
  clientes: [
    "id",
    "nombre",
    "apellido",
    "telefono",
    "correo",
    "idioma",
    "acepta_sms",
    "acepta_sms_en",
    "acepta_correo",
    "notas",
    "creado_en",
  ],
  ordenes: [
    "id",
    "numero",
    "cliente_id",
    "estado",
    "urgente",
    "fecha_local",
    "fecha_promesa",
    "subtotal_cents",
    "recargo_cents",
    "descuento_cents",
    "impuesto_cents",
    "total_cents",
    "pagado_cents",
    "creada_en",
    "entregada_en",
  ],
  pagos: [
    "id",
    "orden_id",
    "metodo",
    "monto_cents",
    "referencia",
    "fecha_local",
    "creado_en",
    "anulado_en",
    "anulado_motivo",
  ],
} as const;

export type TablaCsv = keyof typeof COLUMNAS_CSV;

export function aCsv(filas: Record<string, unknown>[], columnas: readonly string[]): string {
  return (
    [columnas.join(","), ...filas.map((f) => columnas.map((c) => celdaCsv(f[c])).join(","))].join("\r\n") +
    "\r\n"
  );
}

export function csvDeTabla(v: Volcado, tabla: TablaCsv): string {
  const filas = (v.tablas[tabla] ?? []).filter((f) => !(tabla === "clientes" && f.anonimizado_en));
  return aCsv(filas, COLUMNAS_CSV[tabla]);
}
