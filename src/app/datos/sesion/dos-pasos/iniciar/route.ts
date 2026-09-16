import { iniciarDosPasos } from "@/server/auth/dos-pasos";
import { ruta } from "@/server/ruta";

/** Prepara la verificación en dos pasos: secreto nuevo y QR para escanear. */
export const POST = ruta({
  acceso: "pendiente",
  limite: { clave: (c) => `dos-pasos-iniciar:${c.sesion?.usuario.id}`, max: 10, ventanaSeg: 900 },
  manejar: async (c) => iniciarDosPasos(c.db, c.vars.APP_SECRET, c.sesion!),
});
