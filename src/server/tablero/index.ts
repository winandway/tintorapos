import { fechaLocal } from "@/lib/fechas";

export interface DatosTablero {
  cobradoHoyCents: number;
  recibidasHoy: number;
  porEntregar: number;
  atrasadas: number;
  pasos: { tienda: boolean; precios: boolean; empleados: boolean; dispositivo: boolean; orden: boolean };
}

export async function datosTablero(
  db: D1Database,
  tintoreriaId: string,
  zona: string,
  ahora = Date.now(),
): Promise<DatosTablero> {
  const hoy = fechaLocal(ahora, zona);
  const f = await db
    .prepare(
      `select
         (select coalesce(sum(monto_cents), 0) from pagos where tintoreria_id = ?1 and anulado_en is null and fecha_local = ?2) as cobrado,
         (select count(*) from ordenes where tintoreria_id = ?1 and fecha_local = ?2 and estado != 'anulada') as recibidas,
         (select count(*) from ordenes where tintoreria_id = ?1 and estado = 'lista') as listas,
         (select count(*) from ordenes where tintoreria_id = ?1 and estado in ('recibida', 'en_proceso') and fecha_promesa < ?3) as atrasadas,
         (select count(*) from tintorerias where id = ?1 and (telefono is not null or direccion is not null)) as tienda,
         (select count(*) from precios where tintoreria_id = ?1) as precios,
         (select count(*) from usuarios where tintoreria_id = ?1 and activo = 1) as usuarios,
         (select count(*) from dispositivos where tintoreria_id = ?1 and revocado_en is null) as dispositivos,
         (select count(*) from ordenes where tintoreria_id = ?1) as ordenes`,
    )
    .bind(tintoreriaId, hoy, ahora)
    .first<Record<string, number>>();
  return {
    cobradoHoyCents: f?.cobrado ?? 0,
    recibidasHoy: f?.recibidas ?? 0,
    porEntregar: f?.listas ?? 0,
    atrasadas: f?.atrasadas ?? 0,
    pasos: {
      tienda: (f?.tienda ?? 0) > 0,
      precios: (f?.precios ?? 0) > 0,
      empleados: (f?.usuarios ?? 0) > 1,
      dispositivo: (f?.dispositivos ?? 0) > 0,
      orden: (f?.ordenes ?? 0) > 0,
    },
  };
}
