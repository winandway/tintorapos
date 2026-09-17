import type { Metadata } from "next";
import { metadataInicio, PaginaInicio } from "@/components/sitio/pagina-inicio";
import { obtenerIdioma } from "@/lib/i18n/servidor";

/** Portada x-default: idioma por cookie o navegador. Las canónicas por idioma están en /es y /en. */
export async function generateMetadata(): Promise<Metadata> {
  return metadataInicio(await obtenerIdioma(), false);
}

export default async function Inicio() {
  return <PaginaInicio idioma={await obtenerIdioma()} />;
}
