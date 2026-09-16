import { z } from "zod";
import { zonaValida } from "@/lib/fechas";
import { claveAceptable } from "@/server/auth/claves";
import { ErrorApp } from "@/server/errores";

export const esquemaCorreo = z.string().trim().toLowerCase().max(120).pipe(z.email());

export const esquemaNombre = z.string().trim().min(1).max(80);

export const esquemaZona = z.string().max(64).refine(zonaValida, "zona");

export const MONEDAS = [
  "USD",
  "MXN",
  "COP",
  "PEN",
  "CLP",
  "ARS",
  "DOP",
  "GTQ",
  "HNL",
  "CRC",
  "PAB",
  "BOB",
  "PYG",
  "UYU",
  "EUR",
  "CAD",
] as const;

export const esquemaMoneda = z.enum(MONEDAS);

/** Lanza el error de contraseña débil con su código exacto. */
export function exigirClave(clave: string, correo?: string): void {
  const problema = claveAceptable(clave, correo);
  if (problema) throw new ErrorApp(400, `clave_${problema}`, {}, { clave: `clave_${problema}` });
}

/** Regla de la casa: las cuentas de nuestro equipo llevan «Soporte» en el nombre. */
export function exigirNombreSoporte(nombre: string, correo: string | null | undefined): void {
  if (correo && /@windoce\.com$/i.test(correo.trim()) && !/soporte/i.test(nombre)) {
    throw new ErrorApp(400, "soporte_nombre", {}, { nombre: "soporte_nombre" });
  }
}

/** Teléfono: se guarda en formato +<país><número> y aparte solo los dígitos para buscar. */
export function normalizarTelefono(texto: string, pais: string): { e164: string; digitos: string } | null {
  const digitos = texto.replace(/\D/g, "");
  if (!digitos) return null;
  if (texto.trim().startsWith("+")) {
    if (digitos.length < 8 || digitos.length > 15) return null;
    return { e164: `+${digitos}`, digitos };
  }
  const codigos: Record<string, string> = {
    US: "1",
    CA: "1",
    PR: "1",
    DO: "1",
    MX: "52",
    CO: "57",
    PE: "51",
    CL: "56",
    AR: "54",
    VE: "58",
    EC: "593",
    GT: "502",
    HN: "504",
    SV: "503",
    NI: "505",
    CR: "506",
    PA: "507",
    BO: "591",
    PY: "595",
    UY: "598",
    ES: "34",
  };
  const codigo = codigos[pais] ?? "1";
  if (codigo === "1") {
    const nacional = digitos.length === 11 && digitos.startsWith("1") ? digitos.slice(1) : digitos;
    if (nacional.length !== 10) return null;
    return { e164: `+1${nacional}`, digitos: nacional };
  }
  if (digitos.length < 6 || digitos.length > 12) return null;
  return { e164: `+${codigo}${digitos}`, digitos };
}
