import { anularPago, esquemaAnularPago } from "@/server/pagos";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "pagos.cobrar",
  cuerpo: esquemaAnularPago,
  manejar: async (c) => {
    await anularPago(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.motivo, c.cuerpo.autorizacion, c.ahora);
    return { ok: true };
  },
});
