import type { EntradaBuscador } from "./index";

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Todas las palabras tienen que aparecer; pesa más el título que el resumen y el texto. */
export function buscarGuias(indice: EntradaBuscador[], consulta: string, max = 8): EntradaBuscador[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  return indice
    .map((e) => {
      const titulo = normalizar(e.titulo);
      const resumen = normalizar(`${e.resumen} ${e.seccion}`);
      const texto = normalizar(e.texto);
      let puntos = 0;
      for (const p of palabras) {
        if (titulo.includes(p)) puntos += 10;
        else if (resumen.includes(p)) puntos += 4;
        else if (texto.includes(p)) puntos += 1;
        else return null;
      }
      return { e, puntos };
    })
    .filter((x): x is { e: EntradaBuscador; puntos: number } => x !== null)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, max)
    .map((x) => x.e);
}
