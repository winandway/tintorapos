import { notFound } from "next/navigation";
import { MarcoDocs } from "@/components/docs/marco-docs";
import { esIdioma } from "@/lib/i18n";

/** Docs con idioma en la dirección: el mismo marco con la barra lateral que nunca se pierde. */
export default async function LayoutDocsIdioma({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ idioma: string }>;
}) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  return <MarcoDocs idioma={idioma}>{children}</MarcoDocs>;
}
