import { notFound } from "next/navigation";
import { RecordarIdioma } from "@/components/sitio/recordar-idioma";
import { diccionario, esIdioma } from "@/lib/i18n";
import { ProveedorIdioma } from "@/lib/i18n/cliente";

/**
 * Páginas públicas con el idioma en la dirección (/es/…, /en/…): son las canónicas
 * de cada idioma para Google. Reutilizan las mismas pantallas que las direcciones sin
 * idioma. Van como rutas reales (no con proxy) porque el proxy de Next mete en el
 * paquete archivos .wasm y YaDominios necesita UN solo _worker.js (ver CANDADOS.md).
 */
export default async function LayoutIdioma({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ idioma: string }>;
}) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  return (
    <ProveedorIdioma idioma={idioma} d={diccionario(idioma)}>
      {/* El lang del contenido es el de la dirección, aunque la cookie diga otro. React 19 sube
          el meta al <head>: los buscadores leen el idioma sin ejecutar JavaScript. */}
      <meta httpEquiv="content-language" content={idioma} />
      <script
        dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(idioma)}` }}
      />
      <RecordarIdioma idioma={idioma} />
      <div lang={idioma} className="contents">
        {children}
      </div>
    </ProveedorIdioma>
  );
}
