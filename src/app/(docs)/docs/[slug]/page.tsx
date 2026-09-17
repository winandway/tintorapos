import type { Metadata } from "next";
import { metadataGuia, PaginaGuia } from "@/components/docs/pagina-guia";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return metadataGuia(await obtenerIdioma(), (await params).slug, false);
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  return <PaginaGuia idioma={await obtenerIdioma()} slug={(await params).slug} />;
}
