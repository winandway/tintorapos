import { Ticket } from "@/components/ui/ticket";
import type { NombreFigura } from "@/lib/docs";
import { diccionario, fmt, formatoDinero, type Idioma } from "@/lib/i18n";
import { PLANTILLAS_BASE } from "@/server/avisos/plantillas";
import { PRENDAS_ESTANDAR } from "@/server/catalogo/estandar";
import { ROLES, tienePermiso, type Permiso } from "@/server/permisos";

/**
 * Ilustraciones de las guías, dibujadas con los MISMOS textos de la app
 * (diccionarios, plantillas y matriz de permisos): si la app cambia, la figura cambia.
 */

function QrFalso({ className = "size-12" }: { className?: string }) {
  // Patrón fijo que se ve como un QR; no codifica nada.
  const celdas = "1110111010010111010110101001101101110101001010111011100101110110101011011101011101011";
  return (
    <svg viewBox="0 0 9 9" className={className} aria-hidden="true" shapeRendering="crispEdges">
      {[...celdas.slice(0, 81)].map((c, i) =>
        c === "1" ? (
          <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" fill="#16122b" />
        ) : null,
      )}
    </svg>
  );
}

function Etiquetas({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  const nombre = (i: number) => PRENDAS_ESTANDAR[i]?.[idioma] ?? "";
  const lineas = [
    { cant: 2, prenda: nombre(0), cents: 800 },
    { cant: 1, prenda: nombre(6), cents: 1650 },
  ];
  const total = lineas.reduce((a, l) => a + l.cents, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
      <div className="w-56 bg-white px-4 py-5 font-mono text-[11px] text-noche shadow-ticket">
        <p className="text-center text-xs font-bold">{d.docs.figuras.tienda}</p>
        <p className="numero-ticket mt-2 text-center text-4xl">#1043</p>
        <div className="mt-3 space-y-1 border-y border-dashed border-noche/40 py-2">
          {lineas.map((l) => (
            <p key={l.prenda} className="flex justify-between gap-2">
              <span className="truncate">
                {l.cant} × {l.prenda}
              </span>
              <span>{formatoDinero(l.cents, "USD", idioma)}</span>
            </p>
          ))}
        </div>
        <p className="mt-2 flex justify-between font-bold">
          <span>{d.impresion.total}</span>
          <span>{formatoDinero(total, "USD", idioma)}</span>
        </p>
        <p className="mt-3 text-center text-[10px]">{d.impresion.consulta}</p>
        <QrFalso className="mx-auto mt-1 size-14" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-[72px] w-[144px] items-center gap-2 bg-white px-2 text-noche shadow-ticket"
          >
            <QrFalso className="size-12 shrink-0" />
            <div className="min-w-0">
              <p className="numero-ticket text-xl leading-none">#1043</p>
              <p className="mt-1 text-[9px] leading-tight font-semibold">
                {d.ordenes.dias[3]} · {fmt(d.impresion.pieza, { i, n: 3 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Estados({ idioma }: { idioma: Idioma }) {
  const e = diccionario(idioma).ordenes.estados;
  const pasos = [e.recibida, e.en_proceso, e.lista, e.entregada];
  return (
    <ol className="flex flex-wrap items-center justify-center gap-2">
      {pasos.map((p, i) => (
        <li key={p} className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-1.5 text-sm font-semibold shadow-ticket">
            <Ticket
              numero={i + 1}
              dia={i + 1}
              tamano="chico"
              className="!w-8 !pt-2.5 !pb-1 [&>span:first-child]:hidden"
            />
            {p}
          </span>
          {i < pasos.length - 1 && (
            <svg viewBox="0 0 16 16" className="size-4 text-gris-claro" aria-hidden="true">
              <path
                d="m6 3 5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}

function Conexion({ idioma }: { idioma: Idioma }) {
  const c = diccionario(idioma).comun;
  const estados = [
    {
      texto: `${c.sinConexion} · ${fmt(c.pendientesSync, { n: 3 })}`,
      clase: "bg-alerta-suave text-alerta",
      punto: "bg-alerta",
    },
    { texto: c.sincronizando, clase: "bg-white text-tinta", punto: "bg-tinta" },
    { texto: c.enLinea, clase: "bg-ok-suave text-ok", punto: "bg-ok" },
  ];
  return (
    <ul className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      {estados.map((e) => (
        <li
          key={e.texto}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-ticket ${e.clase}`}
        >
          <span className={`size-2.5 rounded-full ${e.punto}`} />
          {e.texto}
        </li>
      ))}
    </ul>
  );
}

const FILAS_ROLES: {
  clave: keyof ReturnType<typeof diccionario>["docs"]["figuras"]["acciones"];
  permiso: Permiso;
}[] = [
  { clave: "recibir", permiso: "ordenes.crear" },
  { clave: "produccion", permiso: "ordenes.cambiar_estado" },
  { clave: "entregar", permiso: "ordenes.entregar" },
  { clave: "caja", permiso: "caja.abrir" },
  { clave: "anular", permiso: "ordenes.anular" },
  { clave: "ajustes", permiso: "ajustes.catalogo" },
  { clave: "empleados", permiso: "empleados.gestionar" },
  { clave: "exportar", permiso: "datos.exportar" },
];

function Roles({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-ticket">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-percha text-left">
            <th scope="col" className="px-3 py-2.5 font-semibold text-gris">
              {d.docs.figuras.rolesAccion}
            </th>
            {ROLES.map((r) => (
              <th key={r} scope="col" className="px-2 py-2.5 text-center font-bold">
                {d.app.roles[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FILAS_ROLES.map((f) => (
            <tr key={f.clave} className="border-b border-percha/60 last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-normal">
                {d.docs.figuras.acciones[f.clave]}
              </th>
              {ROLES.map((r) => (
                <td key={r} className="px-2 py-2 text-center">
                  {tienePermiso(r, f.permiso) ? (
                    <span className="inline-grid size-6 place-items-center rounded-full bg-ok-suave text-ok">
                      <svg
                        viewBox="0 0 16 16"
                        className="size-3.5"
                        role="img"
                        aria-label={d.docs.figuras.puede}
                      >
                        <path
                          d="m3.5 8.5 3 3 6-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-gris-claro" role="img" aria-label={d.docs.figuras.noPuede}>
                      —
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CierreCaja({ idioma }: { idioma: Idioma }) {
  const c = diccionario(idioma).caja;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
      <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-ticket">
        <p className="font-bold">{c.cerrarTitulo}</p>
        <p className="mt-1 text-xs text-gris">{c.cerrarTexto}</p>
        <p className="mt-3 text-xs font-semibold">{c.contado}</p>
        <p className="cifra mt-1 rounded-lg px-3 py-2 text-lg font-semibold ring-2 ring-tinta">
          {formatoDinero(41250, "USD", idioma)}
        </p>
        <p className="mt-3 rounded-lg bg-tinta py-2 text-center text-sm font-semibold text-white">
          {c.cerrar}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col justify-center gap-2 rounded-2xl bg-white p-4 shadow-ticket">
        <p className="text-xs font-semibold text-gris">{c.historial}</p>
        <p className="flex items-center justify-between rounded-lg bg-peligro-suave px-3 py-2 text-sm font-semibold text-peligro">
          <span>{c.diferencia}</span>
          <span>{fmt(c.falta, { monto: formatoDinero(200, "USD", idioma) })}</span>
        </p>
        <p className="flex items-center justify-between rounded-lg bg-ok-suave px-3 py-2 text-sm font-semibold text-ok">
          <span>{c.diferencia}</span>
          <span>{c.cuadra}</span>
        </p>
      </div>
    </div>
  );
}

function PaginaCliente({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  const p = d.publico;
  const pasos = [p.pasos.recibida, p.pasos.en_proceso, p.pasos.lista, p.pasos.entregada];
  return (
    <div className="mx-auto w-64 rounded-[32px] bg-noche p-2.5 shadow-ticket">
      <div className="rounded-[24px] bg-papel px-4 pt-6 pb-5">
        <p className="text-center text-xs font-semibold text-gris">{d.docs.figuras.tienda}</p>
        <p className="titulo-ancho mt-2 text-center text-xl">{fmt(p.orden, { numero: 1043 })}</p>
        <ol className="mt-4 space-y-2">
          {pasos.map((paso, i) => (
            <li key={paso} className="flex items-center gap-2 text-sm">
              <span className={`size-3 rounded-full ${i <= 2 ? "bg-tinta" : "bg-percha"}`} />
              <span className={i === 2 ? "font-bold text-tinta" : i < 2 ? "text-noche" : "text-gris-claro"}>
                {paso}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-ok-suave px-3 py-2 text-sm font-semibold text-ok">{p.listaTexto}</p>
        <p className="mt-2 text-xs text-gris">{fmt(p.piezasListas, { listas: 3, total: 3 })}</p>
        <p className="mt-4 rounded-xl bg-tinta py-2 text-center text-sm font-semibold text-white">
          {p.llamar}
        </p>
      </div>
    </div>
  );
}

function Sms({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  const partes = PLANTILLAS_BASE.lista[idioma].split(/(\{[a-z]+\})/g);
  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] leading-relaxed shadow-ticket">
        {partes.map((parte, i) =>
          /^\{[a-z]+\}$/.test(parte) ? (
            <code key={i} className="rounded bg-tinta-suave px-1 py-0.5 font-mono text-[13px] text-tinta">
              {parte}
            </code>
          ) : (
            <span key={i}>{parte}</span>
          ),
        )}
      </div>
      <p className="mt-3 text-center text-xs text-gris">{d.docs.figuras.variables}</p>
    </div>
  );
}

function PrimerosPasos({ idioma }: { idioma: Idioma }) {
  const t = diccionario(idioma).tablero;
  const pasos = [t.pasos.tienda, t.pasos.precios, t.pasos.empleados, t.pasos.dispositivo, t.pasos.orden];
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-ticket">
      <p className="font-bold">{t.primerosPasos}</p>
      <p className="text-sm text-gris">{t.primerosPasosTexto}</p>
      <ul className="mt-3 space-y-2">
        {pasos.map((paso, i) => (
          <li key={paso} className="flex items-center gap-2.5 text-sm">
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full ${i < 2 ? "bg-ok text-white" : "ring-2 ring-percha"}`}
            >
              {i < 2 && (
                <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
                  <path
                    d="m3.5 8.5 3 3 6-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
            <span className={i < 2 ? "text-gris line-through" : ""}>{paso}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FIGURAS: Record<NombreFigura, (p: { idioma: Idioma }) => React.JSX.Element> = {
  etiquetas: Etiquetas,
  estados: Estados,
  conexion: Conexion,
  roles: Roles,
  cierreCaja: CierreCaja,
  paginaCliente: PaginaCliente,
  sms: Sms,
  primerosPasos: PrimerosPasos,
};

export function Figura({ nombre, pie, idioma }: { nombre: NombreFigura; pie: string; idioma: Idioma }) {
  const Componente = FIGURAS[nombre];
  return (
    <figure className="not-prose my-8">
      <div className="rounded-2xl bg-papel px-4 py-8 ring-1 ring-percha/60 sm:px-8">
        <Componente idioma={idioma} />
      </div>
      <figcaption className="mt-2 text-center text-sm text-gris">{pie}</figcaption>
    </figure>
  );
}
