import { CAPTURAS, type ClaveCaptura } from "@/lib/contenido/capturas";
import type { Idioma } from "@/lib/i18n";

/**
 * Una captura REAL del sistema, dentro de un marco que dice dónde se usa
 * (computadora, tablet, celular o papel). Sin marco falso de ventana con
 * botoncitos de colores: la barra superior es lisa, como la marca.
 */
export function Captura({
  clave,
  idioma,
  prioridad = false,
  className = "",
  conPie = true,
}: {
  clave: ClaveCaptura;
  idioma: Idioma;
  prioridad?: boolean;
  className?: string;
  conPie?: boolean;
}) {
  const c = CAPTURAS[clave];
  const imagen = (
    // Imágenes servidas tal cual (la plataforma no tiene servicio de imágenes):
    // ya salen en webp y al tamaño exacto, por eso no se usa <Image />.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={c.archivo}
      width={c.ancho}
      height={c.alto}
      alt={c.alt[idioma]}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={prioridad ? "high" : undefined}
      className="block h-auto w-full"
    />
  );

  if (c.marco === "celular")
    return (
      <figure className={`mx-auto w-full max-w-[260px] ${className}`}>
        <div className="overflow-hidden rounded-[2rem] bg-noche p-2 shadow-2xl ring-1 ring-noche/20">
          <div className="overflow-hidden rounded-[1.6rem] bg-superficie">{imagen}</div>
        </div>
        {conPie && <Pie texto={c.pie[idioma]} />}
      </figure>
    );

  if (c.marco === "papel")
    return (
      <figure className={`w-full ${className}`}>
        <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-percha">{imagen}</div>
        {conPie && <Pie texto={c.pie[idioma]} />}
      </figure>
    );

  return (
    <figure className={`w-full ${className}`}>
      <div className="overflow-hidden rounded-2xl bg-superficie shadow-2xl ring-1 ring-percha/80">
        <div className="flex items-center gap-1.5 bg-papel px-3 py-2">
          <span className="size-2.5 rounded-full bg-percha" />
          <span className="size-2.5 rounded-full bg-percha" />
          <span className="size-2.5 rounded-full bg-percha" />
          <span className="ml-2 truncate text-[11px] text-gris">
            {c.marco === "tablet" ? "Tintora POS" : "tintorapos.com/app"}
          </span>
        </div>
        {imagen}
      </div>
      {conPie && <Pie texto={c.pie[idioma]} />}
    </figure>
  );
}

function Pie({ texto }: { texto: string }) {
  return <figcaption className="mt-3 text-center text-[14px] text-gris">{texto}</figcaption>;
}
