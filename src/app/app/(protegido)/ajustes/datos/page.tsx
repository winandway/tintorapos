import { AjustesDatos } from "@/components/ajustes/ajustes-datos";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaDatos() {
  const { sesion } = await exigirSesion("datos.exportar");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.datos.titulo}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <AjustesDatos zona={sesion.tintoreria.zonaHoraria} />
    </div>
  );
}
