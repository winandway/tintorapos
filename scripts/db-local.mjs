// Aplica schema.sql a la base LOCAL de desarrollo (y a la de pruebas de punta a punta).
// Nunca toca una base remota: siempre --local.
import { execFileSync } from "node:child_process";

const carpetas = [undefined, ".wrangler/e2e"];
for (const carpeta of carpetas) {
  const args = ["wrangler", "d1", "execute", "DB", "--local", "--file=schema.sql", "--yes"];
  if (carpeta) args.push(`--persist-to=${carpeta}`);
  execFileSync("npx", args, { stdio: "inherit" });
}
