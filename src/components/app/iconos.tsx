export type NombreIcono =
  | "inicio"
  | "mostrador"
  | "ordenes"
  | "produccion"
  | "entrega"
  | "clientes"
  | "caja"
  | "reportes"
  | "ajustes"
  | "mas";

const TRAZOS: Record<NombreIcono, string> = {
  inicio: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z",
  mostrador: "M12 5v14M5 12h14",
  ordenes: "M7 3h10l2 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6l2-3Zm2 7h6m-6 4h6m-6 4h3",
  produccion: "M12 3a2 2 0 0 1 1.2 3.6c-.7.5-1.2 1.1-1.2 1.9V9m0 0L3 14h18l-9-5Zm-7 5v6m14-6v6",
  entrega:
    "M3 7h11v10H3zM14 10h4l3 3v4h-7M7.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  clientes: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a5 5 0 0 0-4-4.9",
  caja: "M3 9h18v11H3zM6 9V5h12v4m-9 5h6",
  reportes: "M4 20V10m6 10V4m6 16v-8m4 8H2",
  ajustes:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  mas: "M5 12h.01M12 12h.01M19 12h.01",
};

export function IconoNav({ nombre, className = "size-5" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={nombre === "mas" ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
