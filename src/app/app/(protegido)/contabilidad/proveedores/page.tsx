import { PantallaProveedores } from "@/components/contabilidad/pantalla-proveedores";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaProveedores() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return <PantallaProveedores moneda={sesion.tintoreria.moneda} />;
}
