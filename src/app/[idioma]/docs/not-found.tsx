import { CuerpoNoEncontrada } from "@/components/sitio/no-encontrada";
import { obtenerIdioma } from "@/lib/i18n/servidor";

/** 404 dentro de Docs: el layout ya pone encabezado, barra y pie. */
export default async function GuiaNoEncontrada() {
  return <CuerpoNoEncontrada idioma={await obtenerIdioma()} />;
}
