import { sinMontos, verOrden } from "@/server/ordenes/consultas";
import { usuarioPuede } from "@/server/permisos";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const s = c.sesion!;
    const orden = await verOrden(c.db, s.tintoreria.id, c.params.id ?? "", c.ahora);
    return { orden: usuarioPuede(s.usuario, "ordenes.ver_montos") ? orden : sinMontos(orden) };
  },
});
