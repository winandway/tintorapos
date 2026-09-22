import type { Metadata } from "next";
import { headers } from "next/headers";
import { Isotipo } from "@/components/marca/logo";
import { Pie } from "@/components/pie";
import { EstadoOrdenEnVivo } from "@/components/publico/estado-orden";
import { aHex, hmacSha256 } from "@/lib/codigos";
import { ahoraMs } from "@/lib/fechas";
import { diccionario, esIdioma, type Idioma } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { obtenerContexto } from "@/server/entorno";
import { limitar } from "@/server/limites";
import { ordenPublica } from "@/server/publico/orden";

export const metadata: Metadata = {
  title: "Estado de tu orden · Order status",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function PaginaEstadoPublico({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { codigo } = await params;
  const { lang } = await searchParams;
  const { env, vars } = obtenerContexto();
  const cab = await headers();
  const ip = cab.get("cf-connecting-ip") ?? cab.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const clave = `publico:${aHex(await hmacSha256(vars.APP_SECRET, `ip:${ip}`)).slice(0, 32)}`;
  const limite = await limitar(env.DB, clave, 60, 60, ahoraMs());
  const orden = limite.permitido ? await ordenPublica(env.DB, codigo) : null;
  const idioma: Idioma = esIdioma(lang) ? lang : (orden?.idiomaCliente ?? (await obtenerIdioma()));
  const d = diccionario(idioma);
  const dp = d.publico;

  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      <main id="contenido" className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        {!orden ? (
          <div className="rounded-3xl bg-superficie p-6 text-center ring-1 ring-percha">
            <h1 className="titulo-ancho text-2xl">{limite.permitido ? dp.noExiste : dp.demasiadas}</h1>
            {limite.permitido && <p className="mt-2 text-gris">{dp.noExisteTexto}</p>}
          </div>
        ) : (
          <EstadoOrdenEnVivo inicial={orden} codigo={codigo} idioma={idioma} />
        )}
        <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-gris">
          <Isotipo className="size-5" />
          {dp.gestionadoCon}
        </div>
      </main>
      <Pie idioma={idioma} compacto />
    </div>
  );
}
