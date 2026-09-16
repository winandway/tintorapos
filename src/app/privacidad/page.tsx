import type { Metadata } from "next";
import { PaginaLegal } from "@/components/sitio/pagina-legal";
import { PRIVACIDAD } from "@/lib/contenido/legal";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { obtenerContexto } from "@/server/entorno";

export async function generateMetadata(): Promise<Metadata> {
  const doc = PRIVACIDAD[await obtenerIdioma()];
  return { title: doc.titulo, description: doc.descripcion, alternates: { canonical: "/privacidad" } };
}

export default async function Pagina() {
  const idioma = await obtenerIdioma();
  const { vars } = obtenerContexto();
  return <PaginaLegal idioma={idioma} doc={PRIVACIDAD[idioma]} correoSoporte={vars.SUPPORT_EMAIL} />;
}
