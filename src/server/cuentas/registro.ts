import { nuevoId } from "@/lib/codigos";
import type { Idioma } from "@/lib/i18n/idiomas";
import { sentenciaAuditoria } from "@/server/auditoria";
import { hashClave } from "@/server/auth/claves";
import { PRENDAS_ESTANDAR, SERVICIOS_ESTANDAR } from "@/server/catalogo/estandar";
import { ErrorApp } from "@/server/errores";

export const DIAS_PRUEBA = 14;

export interface DatosRegistro {
  negocio: string;
  nombre: string;
  correo: string;
  clave: string;
  zonaHoraria: string;
  idioma: Idioma;
  pais: string;
  moneda: string;
  telefono?: string | null;
}

export interface Registro {
  tintoreriaId: string;
  sucursalId: string;
  usuarioId: string;
}

export async function correoEnUso(db: D1Database, correo: string): Promise<boolean> {
  const fila = await db
    .prepare("select id from usuarios /* global: el correo de acceso es único */ where correo = ?")
    .bind(correo.toLowerCase())
    .first();
  return Boolean(fila);
}

/** Crea la tintorería con su sucursal principal, el dueño y el catálogo estándar (sin precios). */
export async function registrarTintoreria(
  db: D1Database,
  d: DatosRegistro,
  ahora = Date.now(),
): Promise<Registro> {
  if (await correoEnUso(db, d.correo))
    throw new ErrorApp(409, "correo_en_uso", {}, { correo: "correo_en_uso" });
  const tintoreriaId = nuevoId();
  const sucursalId = nuevoId();
  const usuarioId = nuevoId();
  const claveHash = await hashClave(d.clave);

  const sentencias: D1PreparedStatement[] = [
    db
      .prepare(
        `insert into tintorerias (id, nombre, telefono, correo, pais, zona_horaria, moneda, idioma, plan, prueba_hasta, creada_en, actualizada_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, 'prueba', ?, ?, ?)`,
      )
      .bind(
        tintoreriaId,
        d.negocio,
        d.telefono ?? null,
        d.correo,
        d.pais,
        d.zonaHoraria,
        d.moneda,
        d.idioma,
        ahora + DIAS_PRUEBA * 24 * 3600_000,
        ahora,
        ahora,
      ),
    db
      .prepare(
        "insert into sucursales (id, tintoreria_id, nombre, telefono, creada_en) values (?, ?, ?, ?, ?)",
      )
      .bind(sucursalId, tintoreriaId, d.negocio, d.telefono ?? null, ahora),
    db
      .prepare(
        `insert into usuarios (id, tintoreria_id, nombre, rol, correo, clave_hash, creado_en, actualizado_en)
         values (?, ?, ?, 'dueno', ?, ?, ?, ?)`,
      )
      .bind(usuarioId, tintoreriaId, d.nombre, d.correo, claveHash, ahora, ahora),
  ];
  SERVICIOS_ESTANDAR.forEach((s, i) => {
    sentencias.push(
      db
        .prepare(
          `insert into catalogo_servicios (id, tintoreria_id, nombre_es, nombre_en, unidad, aplica_impuesto, orden, creado_en)
           values (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(nuevoId(), tintoreriaId, s.es, s.en, s.unidad, s.impuesto ? 1 : 0, i, ahora),
    );
  });
  PRENDAS_ESTANDAR.forEach((p, i) => {
    sentencias.push(
      db
        .prepare(
          "insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, orden, creado_en) values (?, ?, ?, ?, ?, ?)",
        )
        .bind(nuevoId(), tintoreriaId, p.es, p.en, i, ahora),
    );
  });
  sentencias.push(
    sentenciaAuditoria(
      db,
      {
        tintoreriaId,
        usuarioId,
        accion: "cuenta.registrada",
        entidad: "tintoreria",
        entidadId: tintoreriaId,
      },
      ahora,
    ),
  );
  try {
    await db.batch(sentencias);
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) {
      throw new ErrorApp(409, "correo_en_uso", {}, { correo: "correo_en_uso" });
    }
    throw e;
  }
  return { tintoreriaId, sucursalId, usuarioId };
}
