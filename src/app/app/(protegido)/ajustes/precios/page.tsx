import { EditorPrecios } from "@/components/ajustes/editor-precios";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { unidadPeso } from "@/server/ajustes/tienda";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaPrecios() {
  const { sesion, db } = await exigirSesion("ajustes.catalogo");
  const peso = await unidadPeso(db, sesion.tintoreria.id);
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.precios.titulo}
        subtitulo={d.ajustes.precios.ayuda}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <EditorPrecios moneda={sesion.tintoreria.moneda} unidadPeso={peso} />
    </div>
  );
}
