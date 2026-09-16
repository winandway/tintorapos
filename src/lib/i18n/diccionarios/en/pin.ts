import type { pin as base } from "../es/pin";
import type { Forma } from "../../index";

export const pin: Forma<typeof base> = {
  titulo: "Who's working?",
  subtitulo: "Tap your name and enter your PIN.",
  entrar: "Sign in",
  borrar: "Delete a digit",
  cambiarPersona: "Switch person",
  bloqueado: "Locked",
  sinEmpleados: "No employees have a PIN yet. The owner adds them in Settings → Employees.",
  entrarDueno: "Sign in with the owner account",
  autorizacionTitulo: "Manager approval",
  autorizacionTexto: "This action needs a manager to approve it with their PIN. We record who approved it.",
  autorizar: "Approve",
  sinAutorizadores: "No managers have a PIN. The owner can set one in Settings → Employees.",
  bloquearPantalla: "Lock screen",
  dispositivoDe: "Device “{dispositivo}” at {tienda}",
};
