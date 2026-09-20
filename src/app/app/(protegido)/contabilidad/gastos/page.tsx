import { PantallaGastos } from "@/components/contabilidad/pantalla-gastos";
import { ahoraMs, fechaLocal } from "@/lib/fechas";
import { listarEmpleados } from "@/server/empleados";
import { exigirSesion } from "@/server/pagina";
import { usuarioPuede } from "@/server/permisos";

export default async function PaginaGastos() {
  const { sesion, db } = await exigirSesion("contabilidad.ver");
  // La lista de empleados solo se trae si esta persona puede verla; si no,
  // el gasto simplemente no se puede asignar a nadie.
  const empleados = usuarioPuede(sesion.usuario, "empleados.gestionar")
    ? (await listarEmpleados(db, sesion.tintoreria.id)).map((e) => ({ id: e.id, nombre: e.nombre }))
    : [];
  return (
    <PantallaGastos
      moneda={sesion.tintoreria.moneda}
      hoy={fechaLocal(ahoraMs(), sesion.tintoreria.zonaHoraria)}
      empleados={empleados}
    />
  );
}
