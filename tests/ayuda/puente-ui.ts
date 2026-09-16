import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ORIGEN } from "./cliente-http";

/**
 * Puente para las pruebas de PANTALLAS: el `fetch` del componente llega a las
 * rutas /datos REALES (con la base D1 local de pruebas), como en el navegador.
 * Hace de navegador: guarda las cookies que responde el servidor, las manda en
 * cada pedido y pone el Origin. La cabecera CSRF la pone el componente (api.ts).
 */
type Manejador = (req: Request, extra?: { params: Promise<Record<string, string>> }) => Promise<Response>;

const raizApp = path.resolve(import.meta.dirname, "../../src/app");

function rutas(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return rutas(p);
    return f === "route.ts" ? ["/" + path.relative(raizApp, path.dirname(p)).split(path.sep).join("/")] : [];
  });
}

const TABLA = rutas(raizApp)
  .filter((r) => r.startsWith("/datos") || r.startsWith("/media"))
  // Las rutas fijas antes que las de [parámetro].
  .sort((a, b) => (a.match(/\[/g)?.length ?? 0) - (b.match(/\[/g)?.length ?? 0));

function buscarRuta(ruta: string): { archivo: string; params: Record<string, string> } | null {
  for (const r of TABLA) {
    const partesR = r.split("/");
    const partes = ruta.split("/");
    if (partesR.length !== partes.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    partesR.forEach((p, i) => {
      const m = /^\[(.+)\]$/.exec(p);
      if (m) params[m[1]!] = decodeURIComponent(partes[i]!);
      else if (p !== partes[i]) ok = false;
    });
    if (ok) return { archivo: path.join(raizApp, r, "route.ts"), params };
  }
  return null;
}

export interface Puente {
  cookies: Map<string, string>;
  pedidos: { metodo: string; url: string; estado: number }[];
  /** Simula que se cae (true) o vuelve (false) internet. */
  sinConexion(v: boolean): void;
  cerrar(): void;
}

export function instalarPuente(cookiesIniciales: Record<string, string> = {}): Puente {
  const original = globalThis.fetch;
  const cookies = new Map(Object.entries(cookiesIniciales));
  const pedidos: Puente["pedidos"] = [];
  let caido = false;
  // El navegador de verdad comparte la cookie CSRF con la página.
  document.cookie = "tp_csrf=csrf-de-prueba-0123456789; path=/";
  cookies.set("tp_csrf", "csrf-de-prueba-0123456789");

  globalThis.fetch = (async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url,
      ORIGEN,
    );
    if (caido) throw new TypeError("Failed to fetch");
    const destino = buscarRuta(url.pathname);
    if (!destino) throw new Error(`Puente: no hay ruta para ${url.pathname}`);
    const modulo = (await import(/* @vite-ignore */ destino.archivo)) as Record<string, Manejador>;
    const metodo = (init.method ?? "GET").toUpperCase();
    const fn = modulo[metodo];
    if (!fn) return new Response(null, { status: 405 });
    const cabeceras = new Headers(init.headers);
    cabeceras.set("origin", ORIGEN);
    cabeceras.set("cookie", [...cookies].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; "));
    cabeceras.set("cf-connecting-ip", "203.0.113.77");
    const req = new Request(`${ORIGEN}${url.pathname}${url.search}`, {
      method: metodo,
      headers: cabeceras,
      body: init.body as BodyInit | null | undefined,
      signal: init.signal ?? null,
    });
    const r = await fn(req, { params: Promise.resolve(destino.params) });
    for (const linea of r.headers.getSetCookie()) {
      const [par = "", ...atributos] = linea.split(";");
      const i = par.indexOf("=");
      const nombre = par.slice(0, i).trim();
      if (atributos.some((a) => a.trim().toLowerCase() === "max-age=0")) cookies.delete(nombre);
      else cookies.set(nombre, decodeURIComponent(par.slice(i + 1).trim()));
    }
    pedidos.push({ metodo, url: url.pathname + url.search, estado: r.status });
    return r;
  }) as typeof fetch;

  return {
    cookies,
    pedidos,
    sinConexion(v) {
      caido = v;
      Object.defineProperty(navigator, "onLine", { configurable: true, get: () => !v });
      window.dispatchEvent(new Event(v ? "offline" : "online"));
    },
    cerrar() {
      globalThis.fetch = original;
    },
  };
}
