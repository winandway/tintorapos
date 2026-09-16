/**
 * Cliente de pruebas para las rutas /datos: arma la petición como lo haría el
 * navegador (Origin, cookie y cabecera CSRF) y guarda las cookies que devuelve.
 */
export const ORIGEN = "https://tintora.prueba";

type Manejador = (
  req: Request,
  extra?: { params: Promise<Record<string, string | string[]>> },
) => Promise<Response>;

export class Navegador {
  cookies = new Map<string, string>([["tp_csrf", "csrf-de-prueba-0123456789"]]);
  cabecerasExtra: Record<string, string> = {};

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
