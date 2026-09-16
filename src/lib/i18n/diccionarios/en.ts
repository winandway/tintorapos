import type { Forma } from "../index";
import { comun } from "./en/comun";
import { correos } from "./en/correos";
import { pin } from "./en/pin";
import { acceso } from "./en/acceso";
import { app } from "./en/app";
import { errores } from "./en/errores";
import { validacion } from "./en/validacion";
import type { es } from "./es";

export const en: Forma<typeof es> = { comun, errores, validacion, correos, pin, acceso, app };
