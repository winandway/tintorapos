import { ErrorApi, pedir } from "@/lib/api";
import { nuevoId } from "@/lib/codigos";
import { agregarOperacion, operaciones, quitarOperacion, type OperacionLocal } from "./almacen";

export const EVENTO_COLA = "tintora:cola";

function avisarCambio() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_COLA));
}

export async function encolar(
  op: Omit<OperacionLocal, "id" | "creadoEn"> & { id?: string; creadoEn?: number },
): Promise<OperacionLocal> {
  const completa: OperacionLocal = { ...op, id: op.id ?? nuevoId(), creadoEn: op.creadoEn ?? Date.now() };
  await agregarOperacion(completa);
  avisarCambio();
  return completa;
}

export interface EstadoCola {
  pendientes: number;
  conError: number;
}

export async function estadoCola(): Promise<EstadoCola> {
  const ops = await operaciones();
  return { pendientes: ops.filter((o) => !o.error).length, conError: ops.filter((o) => o.error).length };
}

let enCurso: Promise<ResultadoSincronizacion> | null = null;

export interface ResultadoSincronizacion {
  subidas: number;
  conError: number;
  sinConexion: boolean;
  sesionVencida: boolean;
}

interface RespuestaSync {
  resultados: ({ id: string; ok: true } | { id: string; ok: false; codigo: string; mensaje: string })[];
  detenido: boolean;
}

/** Sube la cola en orden, de a 25. Una sola sincronización a la vez. */
export function sincronizar(): Promise<ResultadoSincronizacion> {
  if (enCurso) return enCurso;
  enCurso = (async () => {
    const r: ResultadoSincronizacion = { subidas: 0, conError: 0, sinConexion: false, sesionVencida: false };
    try {
      for (;;) {
        const lote = (await operaciones()).filter((o) => !o.error).slice(0, 25);
        if (!lote.length) break;
        let respuesta: RespuestaSync;
        try {
          respuesta = await pedir<RespuestaSync>("/datos/sync", {
            cuerpo: {
              ops: lote.map(({ id, tipo, ordenId, cuerpo, creadoEn }) => ({
                id,
                tipo,
                ...(ordenId ? { ordenId } : {}),
                cuerpo,
                creadoEn,
              })),
            },
          });
        } catch (e) {
          if (e instanceof ErrorApi && e.sinConexion) r.sinConexion = true;
          else if (e instanceof ErrorApi && (e.estado === 401 || e.codigo === "requiere_dos_pasos"))
            r.sesionVencida = true;
          else throw e;
          break;
        }
        for (const res of respuesta.resultados) {
          const op = lote.find((o) => o.id === res.id);
          if (!op) continue;
          if (res.ok) {
            await quitarOperacion(op.id);
            r.subidas++;
          } else {
            await agregarOperacion({ ...op, error: { codigo: res.codigo, mensaje: res.mensaje } });
            r.conError++;
          }
        }
        if (respuesta.detenido || respuesta.resultados.length < lote.length) break;
      }
    } finally {
      enCurso = null;
      avisarCambio();
    }
    return r;
  })();
  return enCurso;
}

/** Descarta una operación con error después de que alguien la revisó. */
export async function descartarOperacion(id: string): Promise<void> {
  await quitarOperacion(id);
  avisarCambio();
}
