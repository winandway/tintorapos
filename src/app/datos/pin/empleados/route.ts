import { empleadosConPin } from "@/server/dispositivos";
import { ruta } from "@/server/ruta";

/** Pantalla de PIN del dispositivo: la lista de empleados que pueden entrar. */
export const GET = ruta({
  acceso: "dispositivo",
  manejar: async (c) => ({
    tienda: c.dispositivo!.tintoreriaNombre,
    dispositivo: c.dispositivo!.nombre,
    bloqueoInactividadMin: c.dispositivo!.bloqueoInactividadMin,
    empleados: await empleadosConPin(c.db, c.dispositivo!.tintoreriaId),
  }),
});
