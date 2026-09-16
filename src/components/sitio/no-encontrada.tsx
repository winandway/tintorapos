import Link from "next/link";
import { clasesBoton } from "@/components/ui/boton";
import { Ticket } from "@/components/ui/ticket";
import { diccionario, type Idioma } from "@/lib/i18n";

/** Cuerpo del 404: se usa suelto (dentro de Docs) o con encabezado y pie (resto del sitio). */
export function CuerpoNoEncontrada({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma).comun;
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Ticket numero="404" dia={0} tamano="grande" className="-rotate-3" />
      <h1 className="titulo-ancho mt-8 text-3xl leading-tight sm:text-4xl">{d.noEncontradaTitulo}</h1>
      <p className="mt-3 text-lg text-gris">{d.noEncontradaTexto}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={clasesBoton("primario", "grande")}>
          {d.irInicio}
        </Link>
        <Link href="/docs" className={clasesBoton("secundario", "grande")}>
          {d.docs}
        </Link>
      </div>
    </div>
  );
}
