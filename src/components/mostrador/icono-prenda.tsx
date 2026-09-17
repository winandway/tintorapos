import type { ClaveIcono } from "@/lib/mostrador/iconos";

/**
 * Dibujos de las prendas para el mostrador. Trazo simple (hereda el color del
 * texto), para que se reconozcan de un vistazo en una tablet y en una pantalla
 * de tienda. Se eligen con `iconoDePrenda()`.
 */
const DIBUJOS: Record<ClaveIcono, React.ReactNode> = {
  camisa: (
    <>
      <path d="M9 3 5 4.8 3.5 9.2 6.2 10.3V21h11.6V10.3l2.7-1.1L19 4.8 15 3l-3 3.2z" />
      <path d="M9 3l3 3.2L15 3" />
    </>
  ),
  blusa: (
    <>
      <path d="M9 3 5 5 3.6 9.4l2.6 1V21h11.6V10.4l2.6-1L19 5l-4-2" />
      <path d="M9 3c0 1.7 1.3 3 3 3s3-1.3 3-3" />
    </>
  ),
  camiseta: (
    <>
      <path d="M9 3 4 5.4 2.8 9.6l3 1.1V21h12.4V10.7l3-1.1L20 5.4 15 3" />
      <path d="M9 3c0 1.7 1.3 2.8 3 2.8S15 4.7 15 3" />
    </>
  ),
  pantalon: (
    <>
      <path d="M7 3h10l1.2 18h-4.1L12 10.5 9.9 21H5.8z" />
      <path d="M7 6.5h10" />
    </>
  ),
  jeans: (
    <>
      <path d="M7 3h10l1.2 18h-4.1L12 10.5 9.9 21H5.8z" />
      <path d="M7 7h10M9.2 4.6v2M14.8 4.6v2" />
    </>
  ),
  falda: (
    <>
      <path d="M8 3h8l4 17.5H4z" />
      <path d="M8 6.5h8" />
    </>
  ),
  vestido: (
    <>
      <path d="M9 3 6.4 6.6 8.4 9 5.5 21h13L15.6 9l2-2.4L15 3" />
      <path d="M9 3c0 1.6 1.3 2.7 3 2.7S15 4.6 15 3" />
      <path d="M8.4 9h7.2" />
    </>
  ),
  vestidoLargo: (
    <>
      <path d="M9.6 3c0 1.5 1.1 2.4 2.4 2.4S14.4 4.5 14.4 3" />
      <path d="M9.6 3 9 8.6 4.6 21h14.8L15 8.6 14.4 3" />
      <path d="M9 8.6h6" />
    </>
  ),
  novia: (
    <>
      <path d="M9.6 3c0 1.5 1.1 2.4 2.4 2.4S14.4 4.5 14.4 3" />
      <path d="M9.6 3 9 9c-3.6 2.6-5 7.3-5 12h16c0-4.7-1.4-9.4-5-12l-.6-6" />
      <path d="M9 9h6M12 12.5v8.5" />
    </>
  ),
  saco: (
    <>
      <path d="M8.5 3 4 5.4V21h16V5.4L15.5 3l-3.5 5z" />
      <path d="M8.5 3 12 8l3.5-5M12 8v13" />
    </>
  ),
  traje: (
    <>
      <path d="M8.5 3 4 5.4V21h16V5.4L15.5 3l-3.5 4.4z" />
      <path d="M8.5 3 12 7.4 15.5 3" />
      <path d="m10.6 8.2 1.4-.8 1.4.8-1.1 1.3z" />
      <path d="m11.3 9.5-.7 5.2 1.4 2.3 1.4-2.3-.7-5.2" />
    </>
  ),
  chaqueta: (
    <>
      <path d="M8.5 3 4 5.4V21h16V5.4L15.5 3" />
      <path d="M8.5 3 12 6.4 15.5 3M12 6.4V21" />
      <path d="M6.6 9.4h2.4M15 9.4h2.4" />
    </>
  ),
  abrigo: (
    <>
      <path d="M8.5 3 4 6v15h16V6l-4.5-3-3.5 3.4z" />
      <path d="M8.5 3 12 6.4 15.5 3M12 6.4V21M4 13h16" />
    </>
  ),
  sueter: (
    <>
      <path d="M8.6 4h6.8l4.2 3.2-2.4 4-1.4-1V21H8.2v-10.8l-1.4 1-2.4-4z" />
      <path d="M8.6 4c0 1.7 1.5 2.6 3.4 2.6S15.4 5.7 15.4 4" />
      <path d="M8.2 18h7.6" />
    </>
  ),
  corbata: (
    <>
      <path d="M10 3h4l1.4 3L12 8.2 8.6 6z" />
      <path d="m12 8.2 3.2 3.2L12 21l-3.2-9.6z" />
    </>
  ),
  uniforme: (
    <>
      <path d="M9 3 5 4.8 3.6 9.2l2.6 1V21h11.6V10.2l2.6-1L19 4.8 15 3l-3 3z" />
      <path d="M9 3l3 3 3-3" />
      <rect x="14" y="12.5" width="3.2" height="4" rx=".6" />
    </>
  ),
  ropaInterior: (
    <>
      <path d="M4 7h16l-1.4 5.6c-.3 1.2-1.4 2-2.6 2-1.5 0-2.8-1-3.2-2.5L12 10l-.8 2.1c-.4 1.5-1.7 2.5-3.2 2.5-1.2 0-2.3-.8-2.6-2z" />
      <path d="M4 7c2.6 1.2 5.3 1.8 8 1.8S17.4 8.2 20 7" />
    </>
  ),
  edredon: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 9.7h18M3 14.3h18M8.5 5v14M15.5 5v14" />
    </>
  ),
  cobija: (
    <>
      <path d="M4 6h13a3 3 0 0 1 3 3v9H7a3 3 0 0 1-3-3z" />
      <path d="M7 6v12M20 12H7" />
    </>
  ),
  sabanas: (
    <>
      <path d="M2.5 18v-6.5a2 2 0 0 1 2-2H15a4.5 4.5 0 0 1 4.5 4.5V18" />
      <path d="M2.5 18h19M4.5 9.5V7a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 11.5 7v2.5" />
    </>
  ),
  almohada: (
    <>
      <rect x="2.5" y="6.5" width="19" height="11" rx="4" />
      <path d="M6.5 8.5c3.6 1.4 7.4 1.4 11 0M6.5 15.5c3.6-1.4 7.4-1.4 11 0" />
    </>
  ),
  toalla: (
    <>
      <path d="M6 4h12a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z" />
      <path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2M10 8.5h6M10 12h6" />
    </>
  ),
  cortina: (
    <>
      <path d="M3 4h18" />
      <path d="M6 4v16c2.6 0 4-2.7 4-8s-1.4-8-4-8M18 4v16c-2.6 0-4-2.7-4-8s1.4-8 4-8" />
      <path d="M10 12h4" />
    </>
  ),
  mantel: (
    <>
      <path d="M3 8h18v3c0 4.4-2.5 7-4.5 7S14 15.4 14 11h-4c0 4.4-2.5 7-4.5 7S3 15.4 3 11z" />
      <path d="M3 8c3-1.6 6-2.4 9-2.4S18 6.4 21 8" />
    </>
  ),
  alfombra: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="M7 6v12M17 6v12M2 8v8M22 8v8" />
    </>
  ),
  zapatos: (
    <>
      <path d="M2.5 17.5v-6l4-1.5 2.6 2.4 4.4.6c3.6.5 6.5 1.6 8 3.1v1.4z" />
      <path d="M2.5 14.5h4.4M9.1 12.4l1.8-2.9" />
    </>
  ),
  bolso: (
    <>
      <path d="M4.5 8h15l1.2 12H3.3z" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
    </>
  ),
  gorra: (
    <>
      <path d="M3.5 15.5c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5z" />
      <path d="M20.5 15.5h1.8a1 1 0 0 1 0 2H3.5a1 1 0 0 1 0-2M12 7V4.5" />
    </>
  ),
  canasta: (
    <>
      <path d="M3.5 9h17l-1.6 10.2a2 2 0 0 1-2 1.8H7.1a2 2 0 0 1-2-1.8z" />
      <path d="M7.5 9 9.8 3.4M16.5 9 14.2 3.4M9 13v4M15 13v4M12 13v4" />
    </>
  ),
  percha: (
    <>
      <path d="M12 7.5V6a2 2 0 1 1 2.2 2" />
      <path d="M12 7.5 3.6 14.2A1.5 1.5 0 0 0 4.5 17h15a1.5 1.5 0 0 0 .9-2.8z" />
    </>
  ),
};

export function IconoPrenda({ clave, className = "" }: { clave: ClaveIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {DIBUJOS[clave]}
    </svg>
  );
}
