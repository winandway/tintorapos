import { FormTienda } from "@/components/ajustes/form-tienda";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaTienda() {
  await exigirSesion("ajustes.tienda");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.tienda.titulo}
        subtitulo={d.ajustes.secciones.tienda.texto}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <FormTienda />
    </div>
  );
}
