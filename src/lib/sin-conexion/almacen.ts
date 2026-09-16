/**
 * Almacenamiento local del dispositivo (IndexedDB). Dos cajones:
 * - «cache»: lo último que se bajó del servidor (catálogo, clientes, órdenes abiertas).
 * - «cola»: lo que se hizo sin conexión y falta subir, en orden.
 */
const NOMBRE = "tintora-pos";
const VERSION = 1;

let abierta: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (abierta) return abierta;
  abierta = new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(NOMBRE, VERSION);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache");
      if (!db.objectStoreNames.contains("cola")) db.createObjectStore("cola", { keyPath: "id" });
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => {
      abierta = null;
      rechazar(pedido.error);
    };
  });
  return abierta;
}

function esperar<T>(pedido: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rechazar) => {
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

export async function leerCache<T>(clave: string): Promise<T | undefined> {
  const db = await abrir();
  return esperar(db.transaction("cache", "readonly").objectStore("cache").get(clave)) as Promise<
    T | undefined
  >;
}

export async function guardarCache(clave: string, valor: unknown): Promise<void> {
  const db = await abrir();
  await esperar(db.transaction("cache", "readwrite").objectStore("cache").put(valor, clave));
}

export interface OperacionLocal {
  id: string;
  tipo: "crear_orden" | "estado" | "pago" | "entregar";
  ordenId?: string;
  cuerpo: unknown;
  creadoEn: number;
  /** Error permanente devuelto por el servidor: queda para revisión, no se reintenta. */
  error?: { codigo: string; mensaje: string };
  /** Datos para mostrar la operación en pantalla mientras no se sube (número provisional, cliente…). */
  resumen?: Record<string, unknown>;
}

export async function agregarOperacion(op: OperacionLocal): Promise<void> {
  const db = await abrir();
  await esperar(db.transaction("cola", "readwrite").objectStore("cola").put(op));
}

export async function operaciones(): Promise<OperacionLocal[]> {
  const db = await abrir();
  const todas = (await esperar(
    db.transaction("cola", "readonly").objectStore("cola").getAll(),
  )) as OperacionLocal[];
  return todas.sort((a, b) => a.creadoEn - b.creadoEn);
}

export async function quitarOperacion(id: string): Promise<void> {
  const db = await abrir();
  await esperar(db.transaction("cola", "readwrite").objectStore("cola").delete(id));
}

/** Borra todo lo local (al quitar el registro del dispositivo o si el servidor lo revocó). */
export async function borrarTodo(): Promise<void> {
  const db = await abrir();
  const tx = db.transaction(["cache", "cola"], "readwrite");
  tx.objectStore("cache").clear();
  tx.objectStore("cola").clear();
  await new Promise<void>((resolver, rechazar) => {
    tx.oncomplete = () => resolver();
    tx.onerror = () => rechazar(tx.error);
  });
}

/** Solo para pruebas: cierra la conexión abierta. */
export function _reiniciarAlmacen(): void {
  abierta = null;
}

/** Borra la copia local de datos (clientes, órdenes) pero NUNCA la cola: ahí hay ventas sin subir. */
export async function borrarCache(): Promise<void> {
  const db = await abrir();
  await esperar(db.transaction("cache", "readwrite").objectStore("cache").clear());
}
