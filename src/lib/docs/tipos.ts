import type { IconoSitio } from "@/components/marca/iconos-sitio";

/** Ilustraciones de las guías (se dibujan con los textos reales de la app). */
export type NombreFigura =
  "etiquetas" | "estados" | "conexion" | "roles" | "cierreCaja" | "paginaCliente" | "sms" | "primerosPasos";

/**
 * Bloques de una guía. En los textos:  **negrita**  y  [texto](/docs/guia)  para enlaces.
 */
export type Bloque =
  | { t: "p"; texto: string }
  | { t: "h2"; texto: string }
  | { t: "pasos"; items: string[] }
  | { t: "lista"; items: string[] }
  | { t: "nota"; tono: "consejo" | "importante"; texto: string }
  | { t: "figura"; figura: NombreFigura; pie: string };

export interface TextoGuia {
  titulo: string;
  resumen: string;
  bloques: Bloque[];
}

export type ClaveSeccion = "empezar" | "mostrador" | "planta" | "dinero" | "clientes" | "seguridad";

export interface Guia {
  slug: string;
  seccion: ClaveSeccion;
  icono: IconoSitio;
  es: TextoGuia;
  en: TextoGuia;
}

export interface Seccion {
  clave: ClaveSeccion;
  icono: IconoSitio;
  es: string;
  en: string;
}
