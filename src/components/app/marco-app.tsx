"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Isotipo } from "@/components/marca/logo";
import { SelectorIdioma } from "@/components/selector-idioma";
import { pedir } from "@/lib/api";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";
import { EstadoConexion } from "./estado-conexion";
import { limpiarPaginasGuardadas } from "./registro-sw";
import { IconoNav, type NombreIcono } from "./iconos";

export interface InfoMarco {
  usuario: { nombre: string; rol: string };
  permisos: string[];
  tienda: string;
  tipo: "cuenta" | "pin";
  /** Días de prueba que quedan, calculados en el servidor (null si no está en prueba). */
  diasPrueba: number | null;
  /** Minutos de inactividad antes de bloquear (solo en dispositivos de la tienda). */
  bloqueoMin: number | null;
  /** El correo que falta confirmar (null si ya está o si entró con PIN). */
  correoPorVerificar?: string | null;
}

interface ItemNav {
  ruta: string;
  clave: keyof ReturnType<typeof useIdioma>["d"]["app"]["nav"];
  icono: NombreIcono;
  permiso?: string | string[];
  principal?: boolean;
}

const ITEMS: ItemNav[] = [
  { ruta: "/app", clave: "inicio", icono: "inicio", principal: true },
  {
    ruta: "/app/mostrador",
    clave: "mostrador",
    icono: "mostrador",
    permiso: "ordenes.crear",
    principal: true,
  },
  { ruta: "/app/ordenes", clave: "ordenes", icono: "ordenes", permiso: "ordenes.ver", principal: true },
  { ruta: "/app/produccion", clave: "produccion", icono: "produccion", permiso: "ordenes.cambiar_estado" },
  { ruta: "/app/entrega", clave: "entrega", icono: "entrega", permiso: "ordenes.entregar", principal: true },
  { ruta: "/app/clientes", clave: "clientes", icono: "clientes", permiso: "clientes.ver" },
  { ruta: "/app/caja", clave: "caja", icono: "caja", permiso: "caja.abrir" },
  { ruta: "/app/reportes", clave: "reportes", icono: "reportes", permiso: "reportes.ver" },
  {
    ruta: "/app/ajustes",
    clave: "ajustes",
    icono: "ajustes",
    permiso: ["ajustes.tienda", "empleados.gestionar", "dispositivos.gestionar"],
  },
];

export function MarcoApp({ info, children }: { info: InfoMarco; children: ReactNode }) {
  const { d } = useIdioma();
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  const [cajonAbierto, setCajonAbierto] = useState(false);
  /**
   * El POS manda: al abrirlo, la barra de la izquierda se guarda y la pantalla
   * es toda para atender. El menú sigue a un toque, en la hamburguesa.
   */
  const pantallaCompleta = ruta.startsWith("/app/mostrador");
  const visibles = ITEMS.filter((i) => {
    if (!i.permiso) return true;
    const lista = Array.isArray(i.permiso) ? i.permiso : [i.permiso];
    return lista.some((p) => info.permisos.includes(p));
  });
  const activo = (r: string) => (r === "/app" ? ruta === "/app" : ruta.startsWith(r));
  const principales = visibles.filter((i) => i.principal).slice(0, 4);
  const secundarios = visibles.filter((i) => !principales.includes(i));

  async function salir(destino: string) {
    limpiarPaginasGuardadas();
    try {
      await pedir("/datos/sesion/salir", { metodo: "POST" });
    } finally {
      // Si falla el aviso al servidor, se sale igual.
      recargarEn(destino);
    }
  }

  // Al cambiar de pantalla el cajón se cierra solo (sin efectos: basta la ruta).
  const [rutaDelCajon, setRutaDelCajon] = useState(ruta);
  if (rutaDelCajon !== ruta) {
    setRutaDelCajon(ruta);
    if (cajonAbierto) setCajonAbierto(false);
  }
  useEffect(() => {
    if (!cajonAbierto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setCajonAbierto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [cajonAbierto]);

  useBloqueoInactividad(info.bloqueoMin, () => void salir("/app/pin"));
  const aviso = avisoPrueba(info, d);

  return (
    <div className={pantallaCompleta ? "min-h-dvh" : "min-h-dvh md:grid md:grid-cols-[232px_1fr]"}>
      {cajonAbierto && (
        <div className="fixed inset-0 z-40 flex no-imprimir">
          <div
            className="absolute inset-0 bg-noche/40"
            onClick={() => setCajonAbierto(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-dvh w-72 max-w-[85vw] flex-col bg-superficie shadow-2xl">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <Isotipo className="size-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-tight font-bold">{info.tienda}</span>
                <span className="block text-xs text-gris">Tintora POS</span>
              </span>
              <button
                type="button"
                onClick={() => setCajonAbierto(false)}
                aria-label={d.comun.cerrar}
                className="size-9 rounded-full text-xl text-gris hover:bg-papel"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Tintora POS">
              {visibles.map((i) => (
                <EnlaceNav key={i.ruta} item={i} activo={activo(i.ruta)} texto={d.app.nav[i.clave]} />
              ))}
            </nav>
            <div className="border-t border-percha/70 p-3">
              <SelectorIdioma />
            </div>
          </aside>
        </div>
      )}
      <aside
        className={`sticky top-0 h-dvh flex-col border-r border-percha/70 bg-superficie no-imprimir ${pantallaCompleta ? "hidden" : "hidden md:flex"}`}
      >
        <Link href="/app" className="flex items-center gap-2.5 px-5 py-5">
          <Isotipo className="size-8" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight">{info.tienda}</span>
            <span className="block text-xs text-gris">Tintora POS</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Tintora POS">
          {visibles.map((i) => (
            <EnlaceNav key={i.ruta} item={i} activo={activo(i.ruta)} texto={d.app.nav[i.clave]} />
          ))}
        </nav>
        <div className="border-t border-percha/70 p-3">
          <SelectorIdioma />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-percha/70 bg-papel/90 px-4 backdrop-blur no-imprimir">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCajonAbierto(true)}
              aria-label={d.app.abrirMenu}
              aria-expanded={cajonAbierto}
              className={`grid size-10 shrink-0 place-items-center rounded-xl text-noche hover:bg-tinta-suave ${pantallaCompleta ? "" : "md:hidden"}`}
            >
              <IconoNav nombre="mas" />
            </button>
            <Link
              href="/app"
              className={`flex min-w-0 items-center gap-2 ${pantallaCompleta ? "" : "md:hidden"}`}
            >
              <Isotipo className="size-7" />
              <span className="truncate text-[15px] font-bold">{info.tienda}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <EstadoConexion copiaLocal={info.bloqueoMin !== null && info.permisos.includes("ordenes.ver")} />
            <div className="md:hidden">
              <SelectorIdioma compacto />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
                aria-label={d.app.menuCuenta}
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-tinta-suave"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-tinta text-sm font-bold text-white">
                  {info.usuario.nombre.trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-36 truncate text-sm font-semibold leading-tight">
                    {info.usuario.nombre}
                  </span>
                  <span className="block text-xs text-gris">
                    {d.app.roles[info.usuario.rol as keyof typeof d.app.roles]}
                  </span>
                </span>
              </button>
              {menuAbierto && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-superficie py-1.5 shadow-xl ring-1 ring-percha"
                >
                  <div className="border-b border-percha/70 px-4 pt-2 pb-3 sm:hidden">
                    <p className="font-semibold">{info.usuario.nombre}</p>
                    <p className="text-sm text-gris">
                      {d.app.roles[info.usuario.rol as keyof typeof d.app.roles]}
                    </p>
                  </div>
                  {info.bloqueoMin !== null && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void salir("/app/pin")}
                      className="block w-full px-4 py-2.5 text-left text-[15px] hover:bg-papel"
                    >
                      {d.app.bloquear}
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void salir(info.bloqueoMin !== null ? "/app/pin" : "/entrar")}
                    className="block w-full px-4 py-2.5 text-left text-[15px] font-semibold text-peligro hover:bg-papel"
                  >
                    {d.app.salir}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {info.correoPorVerificar && <AvisoVerificarCorreo correo={info.correoPorVerificar} />}

        {aviso && (
          <div
            className={`px-4 py-2 text-center text-sm font-medium no-imprimir ${aviso.tono === "fin" ? "bg-alerta-suave text-alerta" : "bg-tinta-suave text-tinta-oscura"}`}
          >
            {aviso.texto}
          </div>
        )}

        <main
          id="contenido"
          className={`flex-1 pt-5 ${pantallaCompleta ? "px-3 pb-6 md:px-5" : "px-4 pb-28 md:px-8 md:pb-10"}`}
        >
          {children}
        </main>
      </div>

      <nav
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-percha/70 bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur no-imprimir ${pantallaCompleta ? "hidden" : "md:hidden"}`}
        aria-label="Tintora POS"
      >
        <div className="grid grid-cols-5">
          {principales.map((i) => (
            <Link
              key={i.ruta}
              href={i.ruta}
              aria-current={activo(i.ruta) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${activo(i.ruta) ? "text-tinta" : "text-gris"}`}
            >
              <IconoNav nombre={i.icono} />
              {d.app.nav[i.clave]}
            </Link>
          ))}
          {secundarios.length > 0 && (
            <button
              type="button"
              onClick={() => setMasAbierto((v) => !v)}
              aria-expanded={masAbierto}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${masAbierto ? "text-tinta" : "text-gris"}`}
            >
              <IconoNav nombre="mas" />
              {d.app.nav.mas}
            </button>
          )}
        </div>
        {masAbierto && (
          <div className="grid grid-cols-3 gap-2 border-t border-percha/70 p-3">
            {secundarios.map((i) => (
              <Link
                key={i.ruta}
                href={i.ruta}
                onClick={() => setMasAbierto(false)}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold ${activo(i.ruta) ? "bg-tinta text-white" : "bg-papel text-noche"}`}
              >
                <IconoNav nombre={i.icono} />
                {d.app.nav[i.clave]}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

/** Recordatorio de confirmar el correo, con su botón para reenviar el enlace. */
function AvisoVerificarCorreo({ correo }: { correo: string }) {
  const { d } = useIdioma();
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado">("listo");
  if (estado === "enviado")
    return (
      <div className="bg-ok-suave px-4 py-2 text-center text-sm font-medium text-ok no-imprimir">
        {d.acceso.verificacionEnviada}
      </div>
    );
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-alerta-suave px-4 py-2 text-center text-sm font-medium text-alerta no-imprimir">
      <span>{fmt(d.acceso.verificaTuCorreo, { correo })}</span>
      <button
        type="button"
        disabled={estado === "enviando"}
        onClick={async () => {
          setEstado("enviando");
          try {
            await pedir("/datos/cuenta/verificacion", { metodo: "POST" });
            setEstado("enviado");
          } catch {
            setEstado("listo");
          }
        }}
        className="font-bold underline"
      >
        {d.acceso.reenviarVerificacion}
      </button>
    </div>
  );
}

function EnlaceNav({ item, activo, texto }: { item: ItemNav; activo: boolean; texto: string }) {
  return (
    <Link
      href={item.ruta}
      aria-current={activo ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${
        activo ? "bg-tinta text-white" : "text-noche hover:bg-tinta-suave"
      }`}
    >
      <IconoNav nombre={item.icono} />
      {texto}
    </Link>
  );
}

function avisoPrueba(
  info: InfoMarco,
  d: ReturnType<typeof useIdioma>["d"],
): { tono: "info" | "fin"; texto: string } | null {
  if (info.diasPrueba === null) return null;
  const dias = info.diasPrueba;
  if (dias <= 0) return { tono: "fin", texto: d.app.pruebaTermino };
  if (dias === 1) return { tono: "fin", texto: d.app.pruebaUltimoDia };
  return { tono: "info", texto: fmt(d.app.pruebaQuedan, { dias }) };
}

/** En una tablet de la tienda, si nadie toca la pantalla en N minutos, se bloquea (vuelve al PIN). */
function useBloqueoInactividad(minutos: number | null, bloquear: () => void) {
  const ultimo = useRef(0);
  const bloquearRef = useRef(bloquear);
  useEffect(() => {
    bloquearRef.current = bloquear;
  }, [bloquear]);
  useEffect(() => {
    if (!minutos) return;
    ultimo.current = Date.now();
    const tocar = () => {
      ultimo.current = Date.now();
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, tocar, { passive: true }));
    const reloj = setInterval(() => {
      if (Date.now() - ultimo.current > minutos * 60_000) bloquearRef.current();
    }, 15_000);
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, tocar));
      clearInterval(reloj);
    };
  }, [minutos]);
}
