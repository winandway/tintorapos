import { diaSemana } from "@/lib/fechas";
import type { DatosSinConexion } from "./cache";

/** Una orden de la copia local con la misma forma que usan Producción y Entrega. */
export function ordenVistaLocal(
  d: DatosSinConexion | undefined,
  ordenId: string,
  zona: string,
  ahora: number,
) {
  const o = d?.ordenes.find((x) => x.id === ordenId);
  if (!d || !o) return null;
  return {
    id: o.id,
    numero: o.numero,
    estado: o.estado,
    urgente: o.urgente === 1,
    dia: diaSemana(o.creada_en, zona),
    fechaPromesa: o.fecha_promesa,
    atrasada: (o.estado === "recibida" || o.estado === "en_proceso") && o.fecha_promesa < ahora,
    totalCents: o.total_cents,
    saldoCents: Math.max(0, o.total_cents - o.pagado_cents),
    cliente: { nombre: o.cliente_nombre, apellido: o.cliente_apellido },
    prendas: d.prendas
      .filter((p) => p.orden_id === o.id)
      .map((p) => ({
        id: p.id,
        prendaEs: p.prenda_es,
        prendaEn: p.prenda_en,
        servicioEs: p.servicio_es,
        servicioEn: p.servicio_en,
        estado: p.estado,
        ubicacion: p.ubicacion,
        codigoEtiqueta: p.codigo_etiqueta,
        notas: null,
      })),
  };
}
