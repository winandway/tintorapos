"use client";

/**
 * Operaciones que cambian datos desde las pantallas de la tienda. Si no hay
 * conexión, quedan en la cola del dispositivo y se suben solas al volver.
 * Todas son seguras de repetir (ids generados en el dispositivo).
 */
import { ErrorApi, pedir } from "./api";
import type { OperacionLocal } from "./sin-conexion/almacen";
import { actualizarLocal } from "./sin-conexion/cache";
import { encolar } from "./sin-conexion/cola";

export interface RespuestaOrden {
  id: string;
  numero: number;
  codigoPublico: string;
  totales: {
    subtotalCents: number;
    recargoCents: number;
    descuentoCents: number;
    impuestoCents: number;
    totalCents: number;
  };
  repetida?: boolean;
  /** true si quedó guardada en el dispositivo para subir cuando vuelva la conexión. */
  enCola?: boolean;
}

function sinRed(e: unknown): boolean {
  return e instanceof ErrorApi && e.sinConexion;
}

async function intentar<T>(
  llamar: () => Promise<T>,
  op: Omit<OperacionLocal, "id" | "creadoEn">,
  optimista: () => T | Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    await encolar(op);
    return optimista();
  }
  try {
    return await llamar();
  } catch (e) {
    if (!sinRed(e)) throw e;
    await encolar(op);
    return optimista();
  }
}

export async function crearOrden(
  cuerpo: Record<string, unknown> & { id: string; codigoPublico: string },
  totales: RespuestaOrden["totales"],
  resumen: { cliente: string },
): Promise<RespuestaOrden> {
  const conAutorizacion = "autorizacion" in cuerpo;
  if (conAutorizacion) return pedir<RespuestaOrden>("/datos/ordenes", { cuerpo });
  return intentar(
    () => pedir<RespuestaOrden>("/datos/ordenes", { cuerpo }),
    { tipo: "crear_orden", cuerpo, resumen },
    () => ({ id: cuerpo.id, numero: 0, codigoPublico: cuerpo.codigoPublico, totales, enCola: true }),
  );
}

export async function cambiarEstadoOrden(
  ordenId: string,
  cuerpo: { estado: string; prendaIds?: string[]; ubicacion?: string },
) {
  return intentar(
    () =>
      pedir<{ estadoNuevo: string; quedoLista: boolean; enCola?: boolean }>(
        `/datos/ordenes/${ordenId}/estado`,
        { cuerpo },
      ),
    { tipo: "estado", ordenId, cuerpo },
    async () => {
      let estadoNuevo = cuerpo.estado;
      await actualizarLocal((d) => {
        const piezas = d.prendas.filter((p) => p.orden_id === ordenId);
        for (const p of piezas) {
          if (!cuerpo.prendaIds?.length || cuerpo.prendaIds.includes(p.id)) {
            p.estado = cuerpo.estado;
            if (cuerpo.ubicacion) p.ubicacion = cuerpo.ubicacion;
          }
        }
        const vivas = piezas.filter((p) => p.estado !== "anulada").map((p) => p.estado);
        estadoNuevo = vivas.every((e) => e === "lista")
          ? "lista"
          : vivas.some((e) => e !== "recibida")
            ? "en_proceso"
            : "recibida";
        const o = d.ordenes.find((x) => x.id === ordenId);
        if (o) o.estado = estadoNuevo;
      });
      return { estadoNuevo, quedoLista: false, enCola: true };
    },
  );
}

export async function registrarPago(
  ordenId: string,
  cuerpo: { id: string; metodo: string; montoCents: number; referencia?: string },
) {
  return intentar(
    () =>
      pedir<{ id: string; repetido: boolean; enCola?: boolean }>(`/datos/ordenes/${ordenId}/pagos`, {
        cuerpo,
      }),
    { tipo: "pago", ordenId, cuerpo },
    async () => {
      await actualizarLocal((d) => {
        const o = d.ordenes.find((x) => x.id === ordenId);
        if (o) o.pagado_cents += cuerpo.montoCents;
      });
      return { id: cuerpo.id, repetido: false, enCola: true };
    },
  );
}

export async function entregarOrden(
  ordenId: string,
  cuerpo: {
    forzar?: boolean;
    pago?: { id: string; metodo: string; montoCents: number; referencia?: string };
  },
) {
  return intentar(
    () => pedir<{ ok: true; enCola?: boolean }>(`/datos/ordenes/${ordenId}/entregar`, { cuerpo }),
    { tipo: "entregar", ordenId, cuerpo },
    async () => {
      await actualizarLocal((d) => {
        d.ordenes = d.ordenes.filter((x) => x.id !== ordenId);
        d.prendas = d.prendas.filter((x) => x.orden_id !== ordenId);
      });
      return { ok: true as const, enCola: true };
    },
  );
}
