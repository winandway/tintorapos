import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataInicio, PaginaInicio } from "@/components/sitio/pagina-inicio";
import { esIdioma } from "@/lib/i18n";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma } = await params;
  return esIdioma(idioma) ? metadataInicio(idioma, true) : {};
}

export default async function InicioConIdioma({ params }: Props) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  return <PaginaInicio idioma={idioma} />;
}
