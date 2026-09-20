import { PantallaCompras } from "@/components/contabilidad/pantalla-compras";
import { ahoraMs, fechaLocal } from "@/lib/fechas";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaCompras() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return (
    <PantallaCompras
      moneda={sesion.tintoreria.moneda}
      hoy={fechaLocal(ahoraMs(), sesion.tintoreria.zonaHoraria)}
    />
  );
}
