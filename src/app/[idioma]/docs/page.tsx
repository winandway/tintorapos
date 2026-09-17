import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataPortadaDocs, PortadaDocs } from "@/components/docs/portada-docs";
import { esIdioma } from "@/lib/i18n";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma } = await params;
  return esIdioma(idioma) ? metadataPortadaDocs(idioma, true) : {};
}

export default async function DocsConIdioma({ params }: Props) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  return <PortadaDocs idioma={idioma} />;
}
