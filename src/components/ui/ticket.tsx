import type { ReactNode } from "react";

/**
 * El ticket de color: la firma visual de Tintora POS. El color es el del DÍA en
 * que entró la orden (como los tickets de papel de las tintorerías).
 */
const FONDOS = ["bg-dia-0", "bg-dia-1", "bg-dia-2", "bg-dia-3", "bg-dia-4", "bg-dia-5", "bg-dia-6"] as const;

export function Ticket({
  numero,
  dia,
  arriba,
  abajo,
  tamano = "normal",
  className = "",
}: {
  numero: ReactNode;
  dia: number;
  arriba?: ReactNode;
  abajo?: ReactNode;
  tamano?: "chico" | "normal" | "grande";
  className?: string;
}) {
  const t = {
    chico: { caja: "w-16 pt-4 pb-2 rounded-[10px]", hoyo: "size-2 top-1.5", num: "text-xl" },
    normal: { caja: "w-24 pt-6 pb-3 rounded-[12px]", hoyo: "size-3 top-2", num: "text-3xl" },
    grande: { caja: "w-40 pt-9 pb-5 rounded-[16px]", hoyo: "size-4 top-3", num: "text-5xl" },
  }[tamano];
  return (
    <div
      className={`relative flex shrink-0 flex-col items-center text-noche shadow-ticket ${FONDOS[((dia % 7) + 7) % 7]} ${t.caja} ${className}`}
    >
      <span
        className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-papel shadow-[inset_0_1px_2px_rgb(0_0_0/0.18)] ${t.hoyo}`}
        aria-hidden="true"
      />
      {arriba && (
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{arriba}</span>
      )}
      <span className={`numero-ticket leading-none ${t.num}`}>{numero}</span>
      {abajo && <span className="mt-1 text-[11px] font-semibold opacity-80">{abajo}</span>}
    </div>
  );
}
