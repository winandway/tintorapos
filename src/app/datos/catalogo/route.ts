import { leerCatalogo } from "@/server/catalogo";
import { sinPermiso } from "@/server/errores";
import { tienePermiso } from "@/server/permisos";
import { ruta } from "@/server/ruta";

/** Catálogo completo (prendas, servicios y precios): lo usan el mostrador y los ajustes. */
export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    const rol = c.sesion!.usuario.rol;
    if (!tienePermiso(rol, "ordenes.crear") && !tienePermiso(rol, "ajustes.catalogo")) throw sinPermiso();
    return leerCatalogo(c.db, c.sesion!.tintoreria.id);
  },
});
