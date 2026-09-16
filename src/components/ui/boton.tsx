import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "peligro" | "exito";
type Tamano = "chico" | "normal" | "grande";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-tinta text-white hover:bg-tinta-oscura shadow-[0_1px_0_rgb(0_0_0/0.08)]",
  secundario:
    "bg-superficie text-noche ring-1 ring-inset ring-percha hover:bg-tinta-suave hover:ring-tinta/30",
  fantasma: "text-tinta hover:bg-tinta-suave",
  peligro: "bg-peligro text-white hover:brightness-95",
  exito: "bg-ok text-white hover:brightness-95",
};

const TAMANOS: Record<Tamano, string> = {
  chico: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  normal: "h-11 px-4 text-[15px] gap-2 rounded-xl",
  grande: "h-14 px-6 text-lg gap-2.5 rounded-2xl",
};

export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "normal", ancho = false) {
  return `inline-flex items-center justify-center font-semibold transition select-none disabled:opacity-50 disabled:pointer-events-none ${VARIANTES[variante]} ${TAMANOS[tamano]} ${ancho ? "w-full" : ""}`;
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  ancho?: boolean;
  cargando?: boolean;
  icono?: ReactNode;
}

export function Boton({
  variante,
  tamano,
  ancho,
  cargando,
  icono,
  children,
  className = "",
  disabled,
  type = "button",
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      className={`${clasesBoton(variante, tamano, ancho)} ${className}`}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <Girando /> : icono}
      {children}
    </button>
  );
}

export function BotonEnlace({
  href,
  variante,
  tamano,
  ancho,
  children,
  className = "",
}: {
  href: string;
  variante?: Variante;
  tamano?: Tamano;
  ancho?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${clasesBoton(variante, tamano, ancho)} ${className}`}>
      {children}
    </Link>
  );
}

export function Girando({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
