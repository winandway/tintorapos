import Link from "next/link";
import { Aviso } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/encabezado";
import { fmt, formatoDinero } from "@/lib/i18n";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";
import { usuarioPuede } from "@/server/permisos";
import { datosTablero } from "@/server/tablero";

export default async function Tablero({
  searchParams,
}: {
  searchParams: Promise<{ "sin-permiso"?: string }>;
}) {
  const { sesion, db } = await exigirSesion();
  const { idioma, d } = await obtenerTextos();
  const dt = d.tablero;
  const sp = await searchParams;
  const t = sesion.tintoreria;
  const datos = await datosTablero(db, t.id, t.zonaHoraria);
  const usuario = sesion.usuario;
  const montos = usuarioPuede(usuario, "reportes.ver");
  const acciones = [
    {
      href: "/app/mostrador",
      texto: dt.acciones.mostrador,
      permiso: "ordenes.crear" as const,
      variante: "primario" as const,
    },
    {
      href: "/app/entrega",
      texto: dt.acciones.entrega,
      permiso: "ordenes.entregar" as const,
      variante: "exito" as const,
    },
    {
      href: "/app/produccion",
      texto: dt.acciones.produccion,
      permiso: "ordenes.cambiar_estado" as const,
      variante: "secundario" as const,
    },
  ].filter((a) => usuarioPuede(usuario, a.permiso));
  const pasos = [
    { clave: "tienda" as const, href: "/app/ajustes/tienda" },
    { clave: "precios" as const, href: "/app/ajustes/precios" },
    { clave: "empleados" as const, href: "/app/ajustes/empleados" },
    { clave: "dispositivo" as const, href: "/app/ajustes/dispositivos" },
    { clave: "orden" as const, href: "/app/mostrador" },
  ];
  const mostrarPasos =
    (usuario.rol === "dueno" || usuario.rol === "gerente") && Object.values(datos.pasos).some((v) => !v);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {sp["sin-permiso"] && <Aviso tono="alerta">{dt.sinPermiso}</Aviso>}
      <div>
        <p className="text-gris">{fmt(dt.hola, { nombre: sesion.usuario.nombre.split(" ")[0] ?? "" })}</p>
        <h1 className="titulo-ancho text-[28px] leading-tight md:text-4xl">
          {fmt(dt.hoy, { tienda: t.nombre })}
        </h1>
      </div>
      {acciones.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {acciones.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${clasesBoton(a.variante, "grande", true)} h-16 text-xl`}
            >
              {a.texto}
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {montos && (
          <div className="col-span-2 rounded-3xl bg-tinta p-5 text-white lg:col-span-1">
            <p className="text-[14px] opacity-80">{dt.cobradoHoy}</p>
            <p className="numero-ticket text-5xl">{formatoDinero(datos.cobradoHoyCents, t.moneda, idioma)}</p>
          </div>
        )}
        <Cifra etiqueta={dt.recibidasHoy} valor={datos.recibidasHoy} href="/app/ordenes" />
        <Cifra etiqueta={dt.porEntregar} valor={datos.porEntregar} href="/app/ordenes" />
        <Cifra
          etiqueta={dt.atrasadas}
          valor={datos.atrasadas}
          href="/app/ordenes"
          peligro={datos.atrasadas > 0}
        />
      </div>
      {mostrarPasos && (
        <Tarjeta>
          <h2 className="text-[19px] font-bold">{dt.primerosPasos}</h2>
          <p className="mb-4 text-[15px] text-gris">{dt.primerosPasosTexto}</p>
          <ol className="space-y-2">
            {pasos.map((p, i) => {
              const hecho = datos.pasos[p.clave];
              return (
                <li key={p.clave}>
                  <Link
                    href={p.href}
                    className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${hecho ? "bg-ok-suave ring-ok/20" : "bg-papel ring-percha hover:ring-tinta"}`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${hecho ? "bg-ok text-white" : "bg-superficie text-tinta ring-1 ring-percha"}`}
                    >
                      {hecho ? "✓" : i + 1}
                    </span>
                    <span
                      className={`flex-1 text-[15px] ${hecho ? "text-ok line-through decoration-ok/40" : "font-semibold"}`}
                    >
                      {dt.pasos[p.clave]}
                    </span>
                    <span className="text-[13px] font-semibold text-tinta">
                      {hecho ? dt.hecho : `${dt.ir} →`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Tarjeta>
      )}
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  href,
  peligro = false,
}: {
  etiqueta: string;
  valor: number;
  href: string;
  peligro?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl p-5 ring-1 transition hover:ring-2 hover:ring-tinta ${peligro ? "bg-peligro-suave ring-peligro/30" : "bg-superficie ring-percha/80"}`}
    >
      <p className="text-[14px] text-gris">{etiqueta}</p>
      <p className={`numero-ticket text-4xl ${peligro ? "text-peligro" : ""}`}>{valor}</p>
    </Link>
  );
}
