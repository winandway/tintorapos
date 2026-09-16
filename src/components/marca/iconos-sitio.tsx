/** Íconos de trazo para la página principal y Docs (24×24, sin relleno). */
export type IconoSitio =
  | "etiqueta"
  | "mensaje"
  | "caja"
  | "escudo"
  | "sinConexion"
  | "reloj"
  | "mostrador"
  | "precio"
  | "escaner"
  | "clientes"
  | "enlace"
  | "pin"
  | "grafica"
  | "descarga"
  | "impresora"
  | "idioma"
  | "llave"
  | "dispositivo"
  | "historial"
  | "capas"
  | "respaldo"
  | "candado"
  | "robot"
  | "libro"
  | "cohete"
  | "ajustes"
  | "pregunta"
  | "entrega";

const TRAZOS: Record<IconoSitio, string> = {
  etiqueta: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4.5h.01M14 14h1v1h-1zM16 16h2v2h-2zM14 18h1v1h-1z",
  mensaje: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 5h8m-8 3h5",
  caja: "M3 10h18v10H3zM6 10V6h12v4m-9 5h6M12 3v3",
  escudo: "M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Zm-3.5 9 2.5 2.5 4.5-5",
  sinConexion:
    "M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.5m5.6-.1A10 10 0 0 1 19 12.9M2 9a15 15 0 0 1 4.3-2.8m4.3-1.1A15 15 0 0 1 22 9M12 20h.01",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  mostrador: "M4 4h16a1 1 0 0 1 1 1v11H3V5a1 1 0 0 1 1-1Zm-1 12h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2Zm7 2h4",
  precio: "M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.8 7 7s2.2 3 5 3.5 5 1.4 5 3.8-2.2 3.2-5 3.2-5-1.1-5-3",
  escaner:
    "M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M7 12h10",
  clientes: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a5 5 0 0 0-4-4.9",
  enlace:
    "M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1 1M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1-1",
  pin: "M5 6h.01M12 6h.01M19 6h.01M5 12h.01M12 12h.01M19 12h.01M5 18h.01M12 18h.01M19 18h.01",
  grafica: "M4 20V10m6 10V4m6 16v-8m4 8H2",
  descarga: "M12 3v12m0 0 5-5m-5 5-5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  impresora:
    "M6 9V3h12v6M6 17H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z",
  idioma: "M4 5h9M8.5 3v2m2.5 0c-1 4-3.5 7-7 9m2.5-5c1.2 2.2 3 4 5.5 5m1 7 4-10 4 10m-6.8-3h5.6",
  llave: "M15 7a4 4 0 1 1-3.5 6L4 20.5V17h2.5v-2.5H9L10.5 13A4 4 0 0 1 15 7Zm1.5 2.5h.01",
  dispositivo: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 15h2",
  historial: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2",
  capas: "M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  respaldo:
    "M4 7c0-2.2 3.6-4 8-4s8 1.8 8 4-3.6 4-8 4-8-1.8-8-4Zm0 0v10c0 2.2 3.6 4 8 4s8-1.8 8-4V7M4 12c0 2.2 3.6 4 8 4s8-1.8 8-4",
  candado:
    "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V7a4 4 0 0 1 8 0v4m-4 4v2",
  robot:
    "M5 9h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm7-5v5M9 14h.01M15 14h.01M2 13v3m20-3v3",
  libro:
    "M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15ZM4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3M8 7h8",
  cohete:
    "M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2m7-4 .5 4.5L13 21l-2-4m-4-4-4-2 2.5-2.5L10 9m4.5 6.5L8.5 9.5C11 4 15 2.5 21 3c.5 6-1 10-6.5 12.5ZM15 9h.01",
  ajustes:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  pregunta:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6m0 3h.01",
  entrega:
    "M3 7h11v10H3zM14 10h4l3 3v4h-7M7.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
};

export function Icono({ nombre, className = "size-5" }: { nombre: IconoSitio; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
