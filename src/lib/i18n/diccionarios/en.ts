import type { Forma } from "../index";
import { comun } from "./en/comun";
import { correos } from "./en/correos";
import { errores } from "./en/errores";
import { validacion } from "./en/validacion";
import type { es } from "./es";

export const en: Forma<typeof es> = { comun, errores, validacion, correos };
