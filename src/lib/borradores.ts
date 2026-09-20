/**
 * NINGÚN FORMULARIO PIERDE LO ESCRITO (regla de la casa, 20 de septiembre de
 * 2026). Lo que la persona escribe se guarda solo en SU navegador mientras
 * escribe, y vuelve a salir si cierra la ventana, se le va el internet, toca
 * «atrás» o se le apaga la computadora.
 *
 * Qué NO se guarda nunca: contraseñas, PIN, códigos de un solo uso y datos de
 * tarjeta. Esos campos se limpian al guardar y al recuperar.
 */
export const PREFIJO = "tintora:borrador:";

/** Campos que jamás se guardan, se llamen como se llamen. */
const PROHIBIDOS = /clave|contrase|password|pin\b|codigo|code|cvv|tarjeta|card|secreto|token/i;

/** Cuánto vive un borrador sin tocarse (7 días). Después estorba más que ayuda. */
export const VIGENCIA_MS = 7 * 24 * 3600_000;

export interface Borrador<T> {
  valor: T;
  guardadoEn: number;
}

/** Quita de un objeto (y de los de adentro) todo lo que no se debe guardar. */
export function sinCamposSensibles<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map((v) => sinCamposSensibles(v)) as unknown as T;
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (PROHIBIDOS.test(k)) continue;
      salida[k] = sinCamposSensibles(v);
    }
    return salida as T;
  }
  return valor;
}

/**
 * La llave de un borrador: el formulario + de quién es. Así, en la computadora
 * del mostrador, el borrador de una persona no le sale a la siguiente.
 */
export function claveBorrador(formulario: string, duenoId?: string | null): string {
  return `${PREFIJO}${formulario}${duenoId ? `:${duenoId}` : ""}`;
}

export function guardarBorrador<T>(clave: string, valor: T, ahora = Date.now()): void {
  try {
    const limpio = sinCamposSensibles(valor);
    localStorage.setItem(clave, JSON.stringify({ valor: limpio, guardadoEn: ahora }));
  } catch {
    // Navegador en modo privado o almacenamiento lleno: se sigue sin guardar.
  }
}

export function leerBorrador<T>(clave: string, ahora = Date.now()): Borrador<T> | null {
  try {
    const texto = localStorage.getItem(clave);
    if (!texto) return null;
    const b = JSON.parse(texto) as Borrador<T>;
    if (!b || typeof b.guardadoEn !== "number" || ahora - b.guardadoEn > VIGENCIA_MS) {
      localStorage.removeItem(clave);
      return null;
    }
    return b;
  } catch {
    return null;
  }
}

export function borrarBorrador(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}

/** Al cerrar sesión no se queda ni un borrador en la computadora. */
export function borrarTodosLosBorradores(): void {
  try {
    for (const clave of Object.keys(localStorage))
      if (clave.startsWith(PREFIJO)) localStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}
