import { crearEmpleado, esquemaEmpleado, listarEmpleados } from "@/server/empleados";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "empleados.gestionar",
  manejar: async (c) => ({ empleados: await listarEmpleados(c.db, c.sesion!.tintoreria.id) }),
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "empleados.gestionar",
  cuerpo: esquemaEmpleado,
  manejar: async (c) => ({ id: await crearEmpleado(c.db, c.sesion!, c.cuerpo, c.ahora) }),
});
