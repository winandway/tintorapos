import type { app as base } from "../es/app";
import type { Forma } from "../../index";

export const app: Forma<typeof base> = {
  nav: {
    inicio: "Home",
    mostrador: "New order",
    ordenes: "Orders",
    produccion: "Production",
    entrega: "Pick up",
    clientes: "Customers",
    caja: "Register",
    reportes: "Reports",
    ajustes: "Settings",
    mas: "More",
  },
  roles: {
    dueno: "Owner",
    gerente: "Manager",
    cajero: "Cashier",
    planta: "Production",
    repartidor: "Driver",
  },
  menuCuenta: "Account menu",
  bloquear: "Lock screen",
  salir: "Sign out",
  pruebaQuedan: "Free trial: {dias} days left.",
  pruebaUltimoDia: "Free trial: today is your last day.",
  pruebaTermino:
    "Your free trial ended. Contact us to activate your plan and keep going without interruptions.",
  sinPermiso: "Your user doesn't have access to that screen.",
  bloqueoAviso: "The screen locked after inactivity.",
};
