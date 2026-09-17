import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FormRegistro } from "@/components/acceso/form-registro";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { metadataLegal, metadataRegistro } from "@/components/sitio/metadatos-publicos";
import { PaginaLegal } from "@/components/sitio/pagina-legal";
import { PRIVACIDAD, TERMINOS } from "@/lib/contenido/legal";
import { esIdioma } from "@/lib/i18n";
import { resolverRutaConIdioma } from "@/lib/rutas-publicas";
import { obtenerContexto } from "@/server/entorno";

type Props = { params: Promise<{ idioma: string; pagina: string }> };

const ATENDIDAS = ["/privacidad", "/terminos", "/registro"];

/** /es/privacidad, /en/privacy, /es/terminos, /en/terms, /es/registro, /en/signup. */
async function resolver(params: Props["params"]) {
  const { idioma, pagina } = await params;
  const ruta = `/${idioma}/${pagina}`;
  const r = esIdioma(idioma) ? resolverRutaConIdioma(ruta) : null;
  if (!r || !ATENDIDAS.includes(r.interna)) return null;
  return { ...r, ruta };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolver(params);
  if (!r) return {};
  if (r.interna === "/registro") return metadataRegistro(r.idioma, true);
  const doc = (r.interna === "/privacidad" ? PRIVACIDAD : TERMINOS)[r.idioma];
  return metadataLegal(doc, r.interna, r.idioma, true);
}

export const dynamic = "force-dynamic";

export default async function PaginaConIdioma({ params }: Props) {
  const r = await resolver(params);
  if (!r) notFound();
  if (r.canonica !== r.ruta) permanentRedirect(r.canonica);
  const { vars } = obtenerContexto();
  if (r.interna === "/registro") {
    return (
      <MarcoAcceso idioma={r.idioma}>
        <FormRegistro siteKey={vars.TURNSTILE_SITE_KEY ?? null} />
      </MarcoAcceso>
    );
  }
  const doc = (r.interna === "/privacidad" ? PRIVACIDAD : TERMINOS)[r.idioma];
  return <PaginaLegal idioma={r.idioma} doc={doc} correoSoporte={vars.SUPPORT_EMAIL} />;
}
