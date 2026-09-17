import type { Metadata } from "next";
import { metadataLegal } from "@/components/sitio/metadatos-publicos";
import { PaginaLegal } from "@/components/sitio/pagina-legal";
import { PRIVACIDAD } from "@/lib/contenido/legal";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { obtenerContexto } from "@/server/entorno";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await obtenerIdioma();
  return metadataLegal(PRIVACIDAD[idioma], "/privacidad", idioma, false);
}

export default async function Pagina() {
  const idioma = await obtenerIdioma();
  const { vars } = obtenerContexto();
  return <PaginaLegal idioma={idioma} doc={PRIVACIDAD[idioma]} correoSoporte={vars.SUPPORT_EMAIL} />;
}
