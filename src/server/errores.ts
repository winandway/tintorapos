/**
 * Errores de la aplicación con código estable. El texto que ve la persona sale
 * del diccionario («errores.<codigo>») en su idioma; el código no cambia nunca.
 */
export const CODIGOS_ERROR = [
  "no_autenticado",
  "sin_permiso",
  "no_encontrado",
  "datos_invalidos",
  "conflicto",
  "demasiados_intentos",
  "csrf",
  "requiere_autorizacion",
  "autorizacion_invalida",
  "requiere_dos_pasos",
  "configuracion",
  "credenciales",
  "pin_incorrecto",
  "pin_bloqueado",
  "dispositivo_no_registrado",
  "dispositivo_revocado",
  "turno_cerrado",
  "turno_abierto",
  "correo_en_uso",
  "turnstile",
  "codigo_incorrecto",
  "cuenta_suspendida",
  "prueba_terminada",
  "demo_lleno",
  "gasto_de_compra",
  "estado_invalido",
  "monto_invalido",
  "pago_excede",
  "codigo_repetido",
  "archivo_grande",
  "tipo_archivo",
  "clave_corta",
  "clave_simple",
  "clave_igual_correo",
  "pin_debil",
  "soporte_nombre",
  "ultimo_dueno",
  "cliente_repetido",
  "saldo_pendiente",
  "orden_cerrada",
  "precio_faltante",
  "enlace_vencido",
  "no_aplica",
  "inesperado",
] as const;

export type CodigoError = (typeof CODIGOS_ERROR)[number];

export class ErrorApp extends Error {
  constructor(
    public estado: number,
    public codigo: CodigoError,
    public vars: Record<string, string | number> = {},
    public campos?: Record<string, string>,
  ) {
    super(codigo);
  }
}

export const noAutenticado = () => new ErrorApp(401, "no_autenticado");
export const sinPermiso = () => new ErrorApp(403, "sin_permiso");
export const noEncontrado = () => new ErrorApp(404, "no_encontrado");
export const invalido = (campos?: Record<string, string>) => new ErrorApp(400, "datos_invalidos", {}, campos);
