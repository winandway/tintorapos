import type { Metadata } from "next";
import { metadataPrecios, PaginaPrecios } from "@/components/sitio/pagina-precios";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  return metadataPrecios(await obtenerIdioma(), false);
}

export const dynamic = "force-dynamic";

export default async function Precios() {
  return <PaginaPrecios idioma={await obtenerIdioma()} />;
}
