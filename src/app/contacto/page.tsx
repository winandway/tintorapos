import type { Metadata } from "next";
import { metadataContacto, PaginaContacto } from "@/components/sitio/pagina-contacto";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  return metadataContacto(await obtenerIdioma(), false);
}

export const dynamic = "force-dynamic";

export default async function Contacto() {
  return <PaginaContacto idioma={await obtenerIdioma()} />;
}
