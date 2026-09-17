import type { Metadata } from "next";
import { metadataPortadaDocs, PortadaDocs } from "@/components/docs/portada-docs";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  return metadataPortadaDocs(await obtenerIdioma(), false);
}

export default async function Pagina() {
  return <PortadaDocs idioma={await obtenerIdioma()} />;
}
