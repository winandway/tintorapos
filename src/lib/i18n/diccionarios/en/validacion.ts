import type { validacion as base } from "../es/validacion";
import type { Forma } from "../../index";

export const validacion: Forma<typeof base> = {
  requerido: "This field is required.",
  invalido: "This value isn't valid.",
  muy_corto: "It's too short.",
  fuera_de_rango: "It's outside the allowed range.",
  muy_largo: "It's too long.",
  correo: "Enter a valid email, like name@example.com.",
  telefono: "Enter a valid phone number, including the area code.",
  debe_cambiar_clave: "Change your password first.",
  zona: "Choose a valid time zone.",
  acepta_terminos: "You must accept the terms to continue.",
  clave_corta: "At least 10 characters.",
  clave_simple: "Use letters and numbers.",
  clave_igual_correo: "It can't contain your email.",
  pin_debil: "4 to 6 digits, not sequential or repeated.",
  claves_distintas: "Passwords don't match.",
};
