import { cookies } from "next/headers";
import { Pie } from "@/components/pie";
import { CuerpoNoEncontrada } from "@/components/sitio/no-encontrada";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { diccionario } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { rutaPagina } from "@/lib/rutas-publicas";
import { COOKIE_SESION } from "@/server/cookies";

/** 404 con la marca: nunca una página en blanco sin salida. */
export default async function NoEncontrada() {
  const idioma = await obtenerIdioma();
  const haySesion = (await cookies()).has(COOKIE_SESION);
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoSitio
        idioma={idioma}
        haySesion={haySesion}
        enlaces={[{ href: rutaPagina(idioma, "docs"), texto: diccionario(idioma).comun.docs }]}
      />
      <main id="contenido" className="flex flex-1">
        <CuerpoNoEncontrada idioma={idioma} />
      </main>
      <Pie idioma={idioma} />
    </div>
  );
}
