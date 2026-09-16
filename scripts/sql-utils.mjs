/**
 * Divide un archivo SQL en sentencias. Respeta los bloques BEGIN…END de los
 * triggers (que llevan ';' adentro) y quita los comentarios de línea.
 * @param {string} sql
 * @returns {string[]}
 */
export function dividirSentencias(sql) {
  const lineas = sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, "").trimEnd())
    .filter((l) => l.trim() !== "");
  const sentencias = [];
  let actual = [];
  let enBloque = false;
  for (const linea of lineas) {
    actual.push(linea);
    const t = linea.trim().toUpperCase();
    if (/\bBEGIN$/.test(t)) enBloque = true;
    if (enBloque) {
      if (/^END;$/.test(t)) {
        enBloque = false;
        sentencias.push(actual.join("\n").replace(/;\s*$/, ""));
        actual = [];
      }
      continue;
    }
    if (t.endsWith(";")) {
      sentencias.push(actual.join("\n").replace(/;\s*$/, ""));
      actual = [];
    }
  }
  if (actual.length) sentencias.push(actual.join("\n"));
  return sentencias.filter((s) => s.trim() !== "");
}
