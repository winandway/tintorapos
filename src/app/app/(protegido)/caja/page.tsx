import { PantallaCaja } from "@/components/caja/pantalla-caja";
import { exigirSesion } from "@/server/pagina";
import { tienePermiso } from "@/server/permisos";

export default async function PaginaCaja() {
  const { sesion } = await exigirSesion("caja.abrir");
  return (
    <PantallaCaja
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      verDiferencias={tienePermiso(sesion.usuario.rol, "caja.ver_diferencias")}
    />
  );
}
