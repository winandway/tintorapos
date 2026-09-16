import type { Metadata } from "next";
import { headers } from "next/headers";
import { Isotipo } from "@/components/marca/logo";
import { Pie } from "@/components/pie";
import { Ticket } from "@/components/ui/ticket";
import { aHex, hmacSha256 } from "@/lib/codigos";
import { ahoraMs } from "@/lib/fechas";
import { diccionario, esIdioma, fmt, formatoFecha, type Idioma } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { obtenerContexto } from "@/server/entorno";
import { limitar } from "@/server/limites";
import { ordenPublica } from "@/server/publico/orden";

export const metadata: Metadata = {
  title: "Estado de tu orden · Order status",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const PASOS = ["recibida", "en_proceso", "lista", "entregada"] as const;

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
          <EstadoOrden orden={orden} idioma={idioma} />
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

function EstadoOrden({
  orden,
  idioma,
}: {
  orden: NonNullable<Awaited<ReturnType<typeof ordenPublica>>>;
  idioma: Idioma;
}) {
  const d = diccionario(idioma);
  const dp = d.publico;
  const indice = PASOS.indexOf(orden.estado as (typeof PASOS)[number]);
  const texto =
    orden.estado === "lista"
      ? dp.listaTexto
      : orden.estado === "en_proceso"
        ? dp.procesoTexto
        : orden.estado === "entregada"
          ? dp.entregadaTexto
          : orden.estado === "anulada"
            ? dp.anuladaTexto
            : orden.estado === "abandonada"
              ? dp.abandonadaTexto
              : dp.recibidaTexto;
  const tel = orden.tienda.telefono?.replace(/[^\d+]/g, "");
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-superficie p-6 ring-1 ring-percha">
        <p className="text-[15px] font-semibold text-tinta">{orden.tienda.nombre}</p>
        <div className="mt-4 flex items-center gap-4">
          <Ticket numero={orden.numero} dia={orden.dia} arriba={d.ordenes.dias[orden.dia]} />
          <div>
            <p className="text-gris">{fmt(dp.hola, { nombre: orden.primerNombre })}</p>
            <h1 className="titulo-ancho text-2xl leading-tight" data-testid="estado-publico">
              {texto}
            </h1>
          </div>
        </div>
        {indice >= 0 && (
          <ol className="mt-6 space-y-3">
            {PASOS.map((p, i) => (
              <li key={p} className="flex items-center gap-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-[14px] font-bold ${i <= indice ? "bg-tinta text-white" : "bg-papel text-gris ring-1 ring-percha"}`}
                >
                  {i <= indice ? "✓" : i + 1}
                </span>
                <span className={i <= indice ? "font-semibold" : "text-gris"}>{dp.pasos[p]}</span>
              </li>
            ))}
          </ol>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-papel p-4 text-[14px]">
          <div>
            <dt className="text-gris">{dp.listaPara}</dt>
            <dd className="font-semibold">
              {formatoFecha(
                orden.fechaPromesa,
                idioma,
                orden.tienda.zona,
                { dateStyle: "medium", timeStyle: "short" },
                orden.tienda.pais,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gris">{fmt(dp.orden, { numero: orden.numero })}</dt>
            <dd className="font-semibold">
              {fmt(dp.piezasListas, { listas: orden.listas, total: orden.piezas })}
            </dd>
          </div>
        </dl>
        {orden.tieneSaldo && orden.estado !== "entregada" && (
          <p className="mt-3 text-[14px] text-alerta">{dp.saldoPendiente}</p>
        )}
      </div>
      {(orden.tienda.direccion || tel) && (
        <div className="rounded-3xl bg-superficie p-5 text-[15px] ring-1 ring-percha">
          {orden.tienda.direccion && (
            <p>{[orden.tienda.direccion, orden.tienda.ciudad].filter(Boolean).join(", ")}</p>
          )}
          {tel && (
            <a
              href={`tel:${tel}`}
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-tinta px-4 font-semibold text-white"
            >
              📞 {dp.llamar}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
