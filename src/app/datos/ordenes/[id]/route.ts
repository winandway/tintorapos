import { sinMontos, verOrden } from "@/server/ordenes/consultas";
import { tienePermiso } from "@/server/permisos";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const s = c.sesion!;
    const orden = await verOrden(c.db, s.tintoreria.id, c.params.id ?? "", c.ahora);
    return { orden: tienePermiso(s.usuario.rol, "ordenes.ver_montos") ? orden : sinMontos(orden) };
  },
});
