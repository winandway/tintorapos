/**
 * Envoltura común de TODAS las rutas /datos. Hace, en este orden:
 * idioma → configuración → CSRF → sesión/dispositivo/reloj → permiso → límite de
 * intentos → validación zod del cuerpo → manejador → errores bilingües.
 * Ninguna ruta lee tintoreria_id de lo que manda el navegador: sale de la sesión.
 */
import { z } from "zod";
import { hmacSha256, aHex, igualesSeguro } from "@/lib/codigos";
import { diccionario, fmt } from "@/lib/i18n";
import { COOKIE_IDIOMA, esIdioma, idiomaDesdeNavegador, type Idioma } from "@/lib/i18n/idiomas";
import type { Variables } from "@/env";
import {
  leerDispositivo,
  leerSesion,
  necesitaDosPasos,
  type DispositivoLeido,
  type Sesion,
} from "./auth/sesiones";
import { COOKIE_CSRF, COOKIE_DISPOSITIVO, COOKIE_SESION, leerCookies } from "./cookies";
import { ErrorConfiguracion, obtenerContexto, type Contexto } from "./entorno";
import { ErrorApp, type CodigoError } from "./errores";
import { limitar } from "./limites";
import { tienePermiso, type Permiso } from "./permisos";

export type Acceso = "publico" | "sesion" | "cuenta" | "pendiente" | "dispositivo" | "reloj";

export interface ContextoRuta<C> {
  req: Request;
  env: CloudflareEnv;
  db: D1Database;
  vars: Variables;
  idioma: Idioma;
  cookies: Record<string, string>;
  params: Record<string, string>;
  cuerpo: C;
  ip: string;
  ipHash: string;
  ahora: number;
  esperarLuego: Contexto["esperarLuego"];
  /** Presente en acceso sesion/cuenta/pendiente (y opcional en publico). */
  sesion: Sesion | null;
  dispositivo: DispositivoLeido | null;
  /** Agrega una cabecera Set-Cookie a la respuesta. */
  ponerCookie: (valor: string) => void;
}

interface OpcionesRuta<S extends z.ZodType | undefined> {
  acceso: Acceso;
  permiso?: Permiso;
  cuerpo?: S;
  /** Permite entrar aunque el usuario deba cambiar su contraseña. */
  permitirCambioClave?: boolean;
  csrf?: boolean;
  limite?: { clave: (c: ContextoRuta<unknown>) => string; max: number; ventanaSeg: number };
  manejar: (c: ContextoRuta<S extends z.ZodType ? z.infer<S> : undefined>) => Promise<Response | object>;
}

type Parametros = { params: Promise<Record<string, string | string[]>> };

const TAMANO_MAX_CUERPO = 1_000_000;

export function idiomaDePeticion(req: Request, cookies: Record<string, string>): Idioma {
  const elegido = cookies[COOKIE_IDIOMA];
  if (esIdioma(elegido)) return elegido;
  return idiomaDesdeNavegador(req.headers.get("accept-language"));
}

export function ipDePeticion(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

export function respuestaError(
  idioma: Idioma,
  estado: number,
  codigo: CodigoError,
  vars: Record<string, string | number> = {},
  campos?: Record<string, string>,
): Response {
  const d = diccionario(idioma);
  const plantilla = (d.errores as Record<string, string>)[codigo] ?? d.errores.inesperado;
  return Response.json(
    {
      error: {
        codigo,
        mensaje: fmt(plantilla, vars),
        ...(campos ? { campos } : {}),
        ...(Object.keys(vars).length ? { vars } : {}),
      },
    },
    { status: estado, headers: { "cache-control": "no-store" } },
  );
}

/** Traduce los problemas de zod a un código simple por campo. */
export function camposDeZod(error: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const i of error.issues) {
    const ruta = i.path.join(".") || "_";
    if (campos[ruta]) continue;
    let codigo = "invalido";
    // Los mensajes propios del código son claves en snake_case (p. ej. «acepta_terminos»).
    if (/^[a-z_]+$/.test(i.message)) codigo = i.message;
    else if (i.code === "invalid_type" && (i as { input?: unknown }).input === undefined)
      codigo = "requerido";
    else if (i.code === "too_small")
      codigo = (i as { minimum?: unknown }).minimum === 1 ? "requerido" : "muy_corto";
    else if (i.code === "too_big") codigo = "muy_largo";
    else if (i.code === "invalid_format" && (i as { format?: string }).format === "email") codigo = "correo";
    campos[ruta] = codigo;
  }
  return campos;
}

function origenPermitido(req: Request, appUrl: string): boolean {
  const origen = req.headers.get("origin");
  if (!origen) return false;
  try {
    const o = new URL(origen).origin;
    return o === new URL(appUrl).origin || o === new URL(req.url).origin;
  } catch {
    return false;
  }
}

export function ruta<S extends z.ZodType | undefined = undefined>(opciones: OpcionesRuta<S>) {
  return async function manejador(req: Request, extra?: Parametros): Promise<Response> {
    const cookies = leerCookies(req.headers.get("cookie"));
    const idioma = idiomaDePeticion(req, cookies);
    const setCookies: string[] = [];
    try {
      let contexto: Contexto;
      try {
        contexto = obtenerContexto();
      } catch (e) {
        if (e instanceof ErrorConfiguracion) {
          console.error(e.message);
          return respuestaError(idioma, 503, "configuracion");
        }
        throw e;
      }
      const { env, vars } = contexto;
      const db = env.DB;
      const ahora = Date.now();
      const metodoLectura = ["GET", "HEAD", "OPTIONS"].includes(req.method);

      if (opciones.csrf !== false && !metodoLectura) {
        const token = req.headers.get("x-csrf") ?? "";
        const galleta = cookies[COOKIE_CSRF] ?? "";
        if (!origenPermitido(req, vars.APP_URL) || token.length < 16 || !igualesSeguro(token, galleta)) {
          return respuestaError(idioma, 403, "csrf");
        }
      }

      const ip = ipDePeticion(req);
      const ipHash = aHex(await hmacSha256(vars.APP_SECRET, `ip:${ip}`)).slice(0, 32);
      const paramsCrudos = extra ? await extra.params : {};
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(paramsCrudos)) params[k] = Array.isArray(v) ? v.join("/") : v;

      let sesion: Sesion | null = null;
      let dispositivo: DispositivoLeido | null = null;

      if (opciones.acceso === "reloj") {
        const auth = req.headers.get("authorization") ?? "";
        if (!vars.RELOJ_SECRETO) return respuestaError(idioma, 503, "configuracion");
        if (!igualesSeguro(auth, `Bearer ${vars.RELOJ_SECRETO}`))
          return respuestaError(idioma, 401, "no_autenticado");
      } else if (opciones.acceso === "dispositivo") {
        dispositivo = await leerDispositivo(db, cookies[COOKIE_DISPOSITIVO], ahora);
        if (!dispositivo) return respuestaError(idioma, 401, "dispositivo_no_registrado");
      } else {
        sesion = await leerSesion(db, cookies[COOKIE_SESION], ahora);
        if (opciones.acceso !== "publico") {
          if (!sesion) return respuestaError(idioma, 401, "no_autenticado");
          if (opciones.acceso !== "pendiente") {
            if (necesitaDosPasos(sesion) && !sesion.segundoFactorOk) {
              return respuestaError(idioma, 401, "requiere_dos_pasos");
            }
            if (sesion.usuario.debeCambiarClave && !opciones.permitirCambioClave) {
              return respuestaError(idioma, 403, "sin_permiso", {}, { _: "debe_cambiar_clave" });
            }
            if (sesion.tintoreria.estado !== "activa")
              return respuestaError(idioma, 403, "cuenta_suspendida");
          }
          if ((opciones.acceso === "cuenta" || opciones.acceso === "pendiente") && sesion.tipo !== "cuenta") {
            return respuestaError(idioma, 403, "sin_permiso");
          }
          if (opciones.permiso && !tienePermiso(sesion.usuario.rol, opciones.permiso)) {
            return respuestaError(idioma, 403, "sin_permiso");
          }
        }
      }

      const base: ContextoRuta<unknown> = {
        req,
        env,
        db,
        vars,
        idioma,
        cookies,
        params,
        cuerpo: undefined,
        ip,
        ipHash,
        ahora,
        esperarLuego: contexto.esperarLuego,
        sesion,
        dispositivo,
        ponerCookie: (v) => setCookies.push(v),
      };

      if (opciones.limite) {
        const r = await limitar(
          db,
          opciones.limite.clave(base),
          opciones.limite.max,
          opciones.limite.ventanaSeg,
          ahora,
        );
        if (!r.permitido) {
          const minutos = Math.max(1, Math.ceil((r.reiniciaEn - ahora) / 60_000));
          const resp = respuestaError(idioma, 429, "demasiados_intentos", { minutos });
          resp.headers.set("retry-after", String(Math.ceil((r.reiniciaEn - ahora) / 1000)));
          return resp;
        }
      }

      if (opciones.cuerpo) {
        const largo = Number(req.headers.get("content-length") ?? "0");
        if (largo > TAMANO_MAX_CUERPO) return respuestaError(idioma, 413, "archivo_grande", { mb: 1 });
        let crudo: unknown;
        try {
          const texto = await req.text();
          if (texto.length > TAMANO_MAX_CUERPO)
            return respuestaError(idioma, 413, "archivo_grande", { mb: 1 });
          crudo = texto ? JSON.parse(texto) : {};
        } catch {
          return respuestaError(idioma, 400, "datos_invalidos");
        }
        const r = opciones.cuerpo.safeParse(crudo);
        if (!r.success) return respuestaError(idioma, 400, "datos_invalidos", {}, camposDeZod(r.error));
        base.cuerpo = r.data;
      }

      const resultado = await opciones.manejar(
        base as ContextoRuta<S extends z.ZodType ? z.infer<S> : undefined>,
      );
      const respuesta =
        resultado instanceof Response
          ? resultado
          : Response.json(resultado, { headers: { "cache-control": "no-store" } });
      for (const c of setCookies) respuesta.headers.append("set-cookie", c);
      return respuesta;
    } catch (e) {
      let resp: Response;
      if (e instanceof ErrorApp) {
        resp = respuestaError(idioma, e.estado, e.codigo, e.vars, e.campos);
      } else {
        console.error(`Error en ${req.method} ${new URL(req.url).pathname}:`, e);
        resp = respuestaError(idioma, 500, "inesperado");
      }
      for (const c of setCookies) resp.headers.append("set-cookie", c);
      return resp;
    }
  };
}
