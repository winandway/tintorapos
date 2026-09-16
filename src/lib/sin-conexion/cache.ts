import { ErrorApi, pedir } from "@/lib/api";
import { guardarCache, leerCache } from "./almacen";

/**
 * Pide datos al servidor y guarda la respuesta; si no hay conexión, devuelve la
 * última copia guardada en el dispositivo.
 */
export async function pedirConCache<T>(url: string): Promise<T> {
  try {
    const datos = await pedir<T>(url);
    guardarCache(`url:${url}`, { datos, guardadoEn: Date.now() }).catch(() => {});
    return datos;
  } catch (e) {
    if (e instanceof ErrorApi && e.sinConexion) {
      const copia = await leerCache<{ datos: T }>(`url:${url}`).catch(() => undefined);
      if (copia) return copia.datos;
    }
    throw e;
  }
}

export interface ClienteLocal {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  telefono_digitos: string | null;
  idioma: "es" | "en";
}

export interface OrdenLocal {
  id: string;
  numero: number;
  codigo_publico: string;
  estado: string;
  urgente: number;
  fecha_promesa: number;
  total_cents: number;
  pagado_cents: number;
  creada_en: number;
  cliente_id: string;
  cliente_nombre: string;
  cliente_apellido: string | null;
}

export interface PrendaLocal {
  id: string;
  orden_id: string;
  prenda_es: string;
  prenda_en: string | null;
  servicio_es: string;
  servicio_en: string | null;
  codigo_etiqueta: string;
  estado: string;
  ubicacion: string | null;
}

export interface DatosSinConexion {
  clientes: ClienteLocal[];
  ordenes: OrdenLocal[];
  prendas: PrendaLocal[];
  generadoEn: number;
}

const CLAVE = "sin-conexion";

export async function refrescarDatosSinConexion(): Promise<void> {
  const datos = await pedir<DatosSinConexion>("/datos/mostrador/cache");
  await guardarCache(CLAVE, datos);
}

export async function datosSinConexion(): Promise<DatosSinConexion | undefined> {
  return leerCache<DatosSinConexion>(CLAVE).catch(() => undefined);
}

/** Actualiza la copia local después de una operación hecha sin conexión. */
export async function actualizarLocal(fn: (d: DatosSinConexion) => void): Promise<void> {
  const d = await datosSinConexion();
  if (!d) return;
  fn(d);
  await guardarCache(CLAVE, d);
}

export function buscarClientesLocal(d: DatosSinConexion | undefined, q: string): ClienteLocal[] {
  if (!d) return [];
  const texto = q.trim().toLowerCase();
  const digitos = q.replace(/\D/g, "");
  return d.clientes
    .filter((c) =>
      digitos.length >= 3 && digitos.length >= q.replace(/[\s()+.-]/g, "").length
        ? (c.telefono_digitos ?? "").includes(digitos)
        : `${c.nombre} ${c.apellido ?? ""}`.toLowerCase().includes(texto),
    )
    .slice(0, 6);
}

/** Busca una orden abierta por código del ticket, de la etiqueta, número o nombre. */
export function buscarOrdenLocal(
  d: DatosSinConexion | undefined,
  texto: string,
  codigo: string | null,
): { orden: OrdenLocal; prendaId: string | null }[] {
  if (!d) return [];
  if (codigo?.length === 20) {
    const o = d.ordenes.find((x) => x.codigo_publico === codigo);
    return o ? [{ orden: o, prendaId: null }] : [];
  }
  if (codigo?.length === 12) {
    const p = d.prendas.find((x) => x.codigo_etiqueta === codigo);
    const o = p ? d.ordenes.find((x) => x.id === p.orden_id) : undefined;
    return o && p ? [{ orden: o, prendaId: p.id }] : [];
  }
  const numero = texto.trim().replace(/^#/, "");
  if (/^\d{1,9}$/.test(numero) && numero.length < 7) {
    const o = d.ordenes.find((x) => x.numero === Number(numero));
    return o ? [{ orden: o, prendaId: null }] : [];
  }
  const t = texto.trim().toLowerCase();
  return d.ordenes
    .filter((o) => `${o.cliente_nombre} ${o.cliente_apellido ?? ""}`.toLowerCase().includes(t))
    .map((orden) => ({ orden, prendaId: null }));
}
