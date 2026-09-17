import { MarcoDocs } from "@/components/docs/marco-docs";
import { obtenerIdioma } from "@/lib/i18n/servidor";

/** Grupo de rutas de Docs (x-default): TODAS las páginas de Docs van dentro y la barra nunca se pierde. */
export default async function LayoutDocs({ children }: { children: React.ReactNode }) {
  return <MarcoDocs idioma={await obtenerIdioma()}>{children}</MarcoDocs>;
}
