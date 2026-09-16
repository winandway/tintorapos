import type { Forma } from "../index";
import { comun } from "./en/comun";
import { correos } from "./en/correos";
import { pin } from "./en/pin";
import { acceso } from "./en/acceso";
import { app } from "./en/app";
import { ajustes } from "./en/ajustes";
import { clientes } from "./en/clientes";
import { ordenes } from "./en/ordenes";
import { caja } from "./en/caja";
import { errores } from "./en/errores";
import { validacion } from "./en/validacion";
import type { es } from "./es";
import { mostrador } from "./en/mostrador";
import { impresion } from "./en/impresion";
import { produccion } from "./en/produccion";
import { entrega } from "./en/entrega";
import { publico } from "./en/publico";
import { avisos } from "./en/avisos";
import { seguridad } from "./en/seguridad";
import { datos } from "./en/datos";
import { reportes } from "./en/reportes";
import { tablero } from "./en/tablero";
import { sinConexion } from "./en/sinConexion";
import { docs } from "./en/docs";

export const en: Forma<typeof es> = {
  comun,
  errores,
  validacion,
  correos,
  pin,
  acceso,
  app,
  ajustes,
  clientes,
  ordenes,
  caja,
  mostrador,
  impresion,
  produccion,
  entrega,
  publico,
  avisos,
  seguridad,
  datos,
  reportes,
  tablero,
  sinConexion,
  docs,
};
