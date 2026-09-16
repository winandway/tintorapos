import Link from "next/link";
import type { ReactNode } from "react";

export function EncabezadoPagina({
  titulo,
  subtitulo,
  volver,
  acciones,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  volver?: { href: string; texto: string };
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {volver && (
        <Link
          href={volver.href}
          className="mb-2 inline-block text-sm font-semibold text-tinta hover:underline"
        >
          {volver.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="titulo-ancho text-[26px] leading-tight md:text-3xl">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-[15px] text-gris">{subtitulo}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-superficie p-5 ring-1 ring-percha/80 md:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[17px] font-bold">{children}</h2>;
}
