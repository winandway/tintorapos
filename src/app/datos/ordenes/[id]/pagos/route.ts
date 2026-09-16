import { esquemaPago, registrarPago } from "@/server/pagos";
import { ruta } from "@/server/ruta";

/** Cobrar o abonar a una orden. */
export const POST = ruta({
  acceso: "sesion",
  permiso: "pagos.cobrar",
  cuerpo: esquemaPago,
  manejar: async (c) => registrarPago(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora),
});
