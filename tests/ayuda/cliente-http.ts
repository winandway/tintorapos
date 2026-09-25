/**
 * Cliente de pruebas para las rutas /datos: arma la petición como lo haría el
 * navegador (Origin, cookie y cabecera CSRF) y guarda las cookies que devuelve.
 */
export const ORIGEN = "https://tintora.prueba";

type Manejador = (
  req: Request,
  extra?: { params: Promise<Record<string, string | string[]>> },
) => Promise<Response>;

/**
 * Cada navegador de prueba es un visitante distinto (su propia IP). Antes la IP
 * salía al azar entre 250 y de vez en cuando dos navegadores coincidían: los
 * límites por IP (5 registros por hora) se sumaban y una prueba fallaba sola.
 * Ahora es un contador: 500 direcciones distintas por archivo, en orden.
 */
let siguienteIp = 0;
function ipNueva(): string {
  const n = siguienteIp++ % 500;
  return n < 250 ? `203.0.113.${n + 1}` : `198.51.100.${n - 250 + 1}`;
}

export class Navegador {
  cookies = new Map<string, string>([["tp_csrf", "csrf-de-prueba-0123456789"]]);
  cabecerasExtra: Record<string, string> = { "cf-connecting-ip": ipNueva() };

  cabeceraCookie(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
  }

  guardarCookies(r: Response) {
    for (const linea of r.headers.getSetCookie()) {
      const [par = "", ...atributos] = linea.split(";");
      const i = par.indexOf("=");
      const nombre = par.slice(0, i).trim();
      const valor = decodeURIComponent(par.slice(i + 1).trim());
      const borrar = atributos.some((a) => a.trim().toLowerCase() === "max-age=0");
      if (borrar) this.cookies.delete(nombre);
      else this.cookies.set(nombre, valor);
    }
  }

  async llamar<T = Record<string, unknown>>(
    manejador: Manejador,
    opciones: {
      metodo?: string;
      ruta?: string;
      cuerpo?: unknown;
      params?: Record<string, string>;
      cabeceras?: Record<string, string>;
      sinCsrf?: boolean;
      cuerpoCrudo?: BodyInit;
    } = {},
  ): Promise<{ estado: number; datos: T; respuesta: Response }> {
    const metodo = opciones.metodo ?? (opciones.cuerpo !== undefined ? "POST" : "GET");
    const cabeceras: Record<string, string> = {
      origin: ORIGEN,
      cookie: this.cabeceraCookie(),
      "accept-language": "es-US,es;q=0.9",
      ...this.cabecerasExtra,
      ...opciones.cabeceras,
    };
    if (!opciones.sinCsrf && !cabeceras["x-csrf"]) cabeceras["x-csrf"] = this.cookies.get("tp_csrf") ?? "";
    let body: BodyInit | undefined = opciones.cuerpoCrudo;
    if (opciones.cuerpo !== undefined) {
      cabeceras["content-type"] = "application/json";
      body = JSON.stringify(opciones.cuerpo);
    }
    const req = new Request(`${ORIGEN}${opciones.ruta ?? "/datos/prueba"}`, {
      method: metodo,
      headers: cabeceras,
      body,
    });
    const respuesta = await manejador(req, { params: Promise.resolve(opciones.params ?? {}) });
    this.guardarCookies(respuesta);
    const texto = await respuesta.clone().text();
    let datos: T;
    try {
      datos = JSON.parse(texto) as T;
    } catch {
      datos = texto as unknown as T;
    }
    return { estado: respuesta.status, datos, respuesta };
  }
}
