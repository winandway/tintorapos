import { diccionario, fmt, formatoDinero, formatoFecha, textoBilingue, type Idioma } from "@/lib/i18n";
import type { DatosTienda } from "@/server/ajustes/tienda";
import type { Orden, PrendaOrden } from "@/server/ordenes/consultas";

function agrupar(prendas: PrendaOrden[]) {
  const m = new Map<string, { p: PrendaOrden; cantidad: number; total: number }>();
  for (const p of prendas.filter((x) => x.estado !== "anulada")) {
    const k = `${p.prendaEs}|${p.servicioEs}|${p.precioUnitCents}|${p.unidad}`;
    const g = m.get(k) ?? { p, cantidad: 0, total: 0 };
    g.cantidad = Math.round((g.cantidad + p.cantidad) * 100) / 100;
    g.total += p.totalCents;
    m.set(k, g);
  }
  return [...m.values()];
}

/** Recibo para impresora térmica de 80 mm (y copia interna con más detalle). */
export function Recibo({
  orden,
  tienda,
  idioma,
  interna,
  enlace,
  qr,
}: {
  orden: Orden;
  tienda: DatosTienda;
  idioma: Idioma;
  interna: boolean;
  enlace: string;
  qr: string | null;
}) {
  const d = diccionario(idioma);
  const di = d.impresion;
  const dinero = (n: number) => formatoDinero(n, tienda.moneda, idioma, tienda.pais);
  const fecha = (n: number) =>
    formatoFecha(n, idioma, tienda.zonaHoraria, { dateStyle: "medium", timeStyle: "short" }, tienda.pais);
  const nombreCliente = interna
    ? `${orden.cliente.nombre} ${orden.cliente.apellido ?? ""}`
    : orden.cliente.nombre;
  return (
    <article
      className="mx-auto w-[80mm] bg-white px-[4mm] py-[5mm] font-sans text-[11pt] leading-snug text-black print:m-0"
      data-testid="recibo"
    >
      <header className="text-center">
        <p className="text-[14pt] font-bold">{tienda.nombre}</p>
        {tienda.direccion && (
          <p className="text-[9pt]">
            {[tienda.direccion, tienda.ciudad, tienda.estadoRegion].filter(Boolean).join(", ")}
          </p>
        )}
        {tienda.telefono && <p className="text-[9pt]">{tienda.telefono}</p>}
        {interna && (
          <p className="mt-1 border-y border-black py-0.5 text-[10pt] font-bold tracking-widest">
            {di.copiaInterna}
          </p>
        )}
      </header>
      <div className="my-3 text-center">
        <p className="text-[9pt] uppercase">{di.orden}</p>
        <p className="numero-ticket text-[40pt] leading-none">#{orden.numero}</p>
        <p className="text-[10pt] font-bold">{d.ordenes.dias[orden.dia]}</p>
        {orden.urgente && (
          <p className="mt-1 inline-block border-2 border-black px-2 text-[11pt] font-bold">{di.urgente}</p>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-[9.5pt]">
        <dt>{di.cliente}:</dt>
        <dd className="text-right font-bold">{nombreCliente}</dd>
        <dt>{di.recibida}:</dt>
        <dd className="text-right">{fecha(orden.creadaEn)}</dd>
        <dt>{di.lista}:</dt>
        <dd className="text-right font-bold">{fecha(orden.fechaPromesa)}</dd>
      </dl>
      <table className="mt-3 w-full border-t border-dashed border-black text-[9.5pt]">
        <tbody>
          {agrupar(orden.prendas).map(({ p, cantidad, total }) => (
            <tr key={`${p.prendaEs}${p.servicioEs}${p.precioUnitCents}`} className="align-top">
              <td className="w-8 pt-1">{p.unidad === "libra" ? `${cantidad}${di.lb}` : `${cantidad}×`}</td>
              <td className="pt-1">
                {textoBilingue(idioma, p.prendaEs, p.prendaEn)}
                <span className="block text-[8.5pt]">
                  {textoBilingue(idioma, p.servicioEs, p.servicioEn)}
                </span>
              </td>
              <td className="pt-1 text-right whitespace-nowrap">{dinero(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-2 border-t border-dashed border-black pt-2 text-[9.5pt]">
        <dt>{di.subtotal}</dt>
        <dd className="text-right">{dinero(orden.subtotalCents)}</dd>
        {orden.recargoCents > 0 && (
          <>
            <dt>{di.recargo}</dt>
            <dd className="text-right">{dinero(orden.recargoCents)}</dd>
          </>
        )}
        {orden.descuentoCents > 0 && (
          <>
            <dt>{di.descuento}</dt>
            <dd className="text-right">−{dinero(orden.descuentoCents)}</dd>
          </>
        )}
        {orden.impuestoCents > 0 && (
          <>
            <dt>
              {di.impuesto} ({orden.impuestoBps / 100}%)
            </dt>
            <dd className="text-right">{dinero(orden.impuestoCents)}</dd>
          </>
        )}
        <dt className="text-[12pt] font-bold">{di.total}</dt>
        <dd className="text-right text-[12pt] font-bold">{dinero(orden.totalCents)}</dd>
        <dt>{di.pagado}</dt>
        <dd className="text-right">{dinero(orden.pagadoCents)}</dd>
        <dt className="font-bold">{di.saldo}</dt>
        <dd className="text-right font-bold">{dinero(orden.saldoCents)}</dd>
      </dl>
      {orden.pagos.filter((p) => !p.anuladoEn).length > 0 && (
        <div className="mt-2 text-[8.5pt]">
          <p className="font-bold">{di.pagos}</p>
          {orden.pagos
            .filter((p) => !p.anuladoEn)
            .map((p) => (
              <p key={p.id} className="flex justify-between">
                <span>
                  {fecha(p.creadoEn)} · {di.metodos[p.metodo as keyof typeof di.metodos] ?? p.metodo}
                </span>
                <span>{dinero(p.montoCents)}</span>
              </p>
            ))}
        </div>
      )}
      {interna && (
        <div className="mt-3 border-t border-dashed border-black pt-2 text-[9pt]">
          {orden.notas && (
            <p>
              <b>{di.notas}:</b> {orden.notas}
            </p>
          )}
          {orden.prendas
            .filter((p) => p.notas || p.color || p.marca)
            .map((p) => (
              <p key={p.id}>
                • {textoBilingue(idioma, p.prendaEs, p.prendaEn)} [{p.codigoEtiqueta}]{" "}
                {[p.color, p.marca, p.notas].filter(Boolean).join(" · ")}
              </p>
            ))}
        </div>
      )}
      {qr && (
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="text-[8.5pt]">{di.consulta}</p>
          <div
            className="my-1 w-[28mm] [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="text-[7.5pt] break-all">{enlace}</p>
        </div>
      )}
      {!interna && (
        <footer className="mt-3 text-center text-[8.5pt]">
          <p>{fmt(di.politica, { dias: tienda.diasAbandono })}</p>
          <p className="mt-1 font-bold">{di.gracias}</p>
        </footer>
      )}
    </article>
  );
}

/** Etiquetas de 2 × 1 pulgadas, una por pieza, con su QR. */
export function Etiquetas({
  orden,
  etiquetas,
  idioma,
  zona,
}: {
  orden: Orden;
  etiquetas: { prenda: PrendaOrden; i: number; n: number; qr: string }[];
  idioma: Idioma;
  zona: string;
}) {
  const d = diccionario(idioma);
  return (
    <div className="flex flex-col items-center gap-2 bg-white print:gap-0">
      {etiquetas.map(({ prenda, i, n, qr }) => (
        <section
          key={prenda.id}
          data-testid="etiqueta"
          className="flex h-[1in] w-[2in] break-after-page items-center gap-[0.06in] overflow-hidden bg-white p-[0.06in] text-black ring-1 ring-percha print:ring-0"
        >
          <div
            className="w-[0.82in] shrink-0 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="numero-ticket text-[22pt] leading-none">#{orden.numero}</p>
            <p className="truncate text-[7.5pt] font-bold">
              {d.ordenes.dias[orden.dia]} · {fmt(d.impresion.pieza, { i, n })}
            </p>
            <p className="truncate text-[7.5pt]">{textoBilingue(idioma, prenda.prendaEs, prenda.prendaEn)}</p>
            <p className="truncate text-[7.5pt]">{orden.cliente.nombre}</p>
            <p className="truncate text-[7pt]">
              {formatoFecha(orden.fechaPromesa, idioma, zona, { month: "short", day: "numeric" })}
              {orden.urgente ? ` · ${d.impresion.urgente}` : ""}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
