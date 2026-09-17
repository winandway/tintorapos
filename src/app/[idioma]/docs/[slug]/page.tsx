import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { metadataGuia, PaginaGuia } from "@/components/docs/pagina-guia";
import { esIdioma } from "@/lib/i18n";
import { resolverRutaConIdioma } from "@/lib/rutas-publicas";

type Props = { params: Promise<{ idioma: string; slug: string }> };

/** /en/docs/getting-started → la guía «primeros-pasos». Un slug del otro idioma redirige al correcto. */
async function resolver(params: Props["params"]) {
  const { idioma, slug } = await params;
  const ruta = `/${idioma}/docs/${slug}`;
  const r = esIdioma(idioma) ? resolverRutaConIdioma(ruta) : null;
  if (!r) return null;
  return { ...r, ruta, slugEs: r.interna.replace("/docs/", "") };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolver(params);
  return r ? metadataGuia(r.idioma, r.slugEs, true) : {};
}

export default async function GuiaConIdioma({ params }: Props) {
  const r = await resolver(params);
  if (!r) notFound();
  if (r.canonica !== r.ruta) permanentRedirect(r.canonica);
  return <PaginaGuia idioma={r.idioma} slug={r.slugEs} />;
}
