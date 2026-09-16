"use client";

/**
 * Operaciones que cambian datos desde las pantallas de la tienda. Pasan por aquí
 * (y no por fetch suelto) para que el modo sin conexión pueda ponerlas en cola.
 */
import { pedir } from "./api";

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

export async function crearOrden(cuerpo: Record<string, unknown>): Promise<RespuestaOrden> {
  return pedir<RespuestaOrden>("/datos/ordenes", { cuerpo });
}

export async function cambiarEstadoOrden(ordenId: string, cuerpo: Record<string, unknown>) {
  return pedir<{ estadoNuevo: string; quedoLista: boolean }>(`/datos/ordenes/${ordenId}/estado`, { cuerpo });
}

export async function registrarPago(ordenId: string, cuerpo: Record<string, unknown>) {
  return pedir<{ id: string; repetido: boolean }>(`/datos/ordenes/${ordenId}/pagos`, { cuerpo });
}

export async function entregarOrden(ordenId: string, cuerpo: Record<string, unknown>) {
  return pedir<{ ok: true }>(`/datos/ordenes/${ordenId}/entregar`, { cuerpo });
}
