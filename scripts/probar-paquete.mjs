// Prueba el PAQUETE que se publica (out-deploy/_worker.js), no el código fuente:
// lo levanta con wrangler en local, con su propia base, y le corre TODAS las
// pruebas de punta a punta. Si esto pasa, lo que sube a YaDominios Cloud funciona.
// Uso: npm run cf:bundle && npm run test:paquete
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const raiz = process.cwd();
const PUERTO = 8799;
if (!existsSync(path.join(raiz, "out-deploy/_worker.js"))) {
  console.error("Falta out-deploy/_worker.js: corre primero npm run cf:bundle");
  process.exit(1);
}
const tmp = mkdtempSync(path.join(os.tmpdir(), "tintora-paquete-"));
const dir = path.join(tmp, "worker");
const estado = path.join(tmp, "estado"); // fuera de la carpeta vigilada: si no, wrangler se recarga sin parar
cpSync(path.join(raiz, "out-deploy"), path.join(dir, "assets"), {
  recursive: true,
  filter: (f) => !/(_worker\.js|schema\.sql|yadominios\.json)$/.test(f),
});
cpSync(path.join(raiz, "out-deploy/_worker.js"), path.join(dir, "worker.js"));
const vars = existsSync(path.join(raiz, ".dev.vars"))
  ? readFileSync(path.join(raiz, ".dev.vars"), "utf8")
  : "";
writeFileSync(
  path.join(dir, ".dev.vars"),
  `${vars.replace(/^APP_URL=.*$/m, "")}\nAPP_URL=http://localhost:${PUERTO}\n`,
);
const flags = JSON.parse(readFileSync(path.join(raiz, "yadominios.json"), "utf8"));
writeFileSync(
  path.join(dir, "wrangler.json"),
  JSON.stringify({
    name: "tintora-pos-paquete",
    main: "worker.js",
    no_bundle: true,
    compatibility_date: flags.compatibility_date,
    compatibility_flags: flags.compatibility_flags,
    assets: { directory: "assets", binding: "ASSETS" },
    d1_databases: [
      { binding: "DB", database_name: "paquete", database_id: "00000000-0000-0000-0000-000000000002" },
    ],
    r2_buckets: [{ binding: "BUCKET", bucket_name: "paquete" }],
  }),
);
const wrangler = path.join(raiz, "node_modules/.bin/wrangler");
execFileSync(
  wrangler,
  [
    "d1",
    "execute",
    "DB",
    "--local",
    `--file=${path.join(raiz, "schema.sql")}`,
    `--persist-to=${estado}`,
    "--yes",
  ],
  {
    cwd: dir,
    stdio: "ignore",
  },
);
const servidor = spawn(
  wrangler,
  ["dev", "--port", String(PUERTO), `--persist-to=${estado}`, "--local", "--live-reload=false"],
  {
    cwd: dir,
    stdio: "ignore",
  },
);
let codigo = 1;
try {
  let listo = false;
  for (let i = 0; i < 90 && !listo; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    listo = await fetch(`http://localhost:${PUERTO}/`).then(
      (r) => r.ok,
      () => false,
    );
  }
  if (!listo) throw new Error("El paquete no respondió en 90 segundos");
  execFileSync("npx", ["playwright", "test"], {
    cwd: raiz,
    stdio: "inherit",
    env: { ...process.env, E2E_URL: `http://localhost:${PUERTO}` },
  });
  codigo = 0;
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
} finally {
  servidor.kill();
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(codigo);
