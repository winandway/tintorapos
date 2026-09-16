// Compila Tintora POS y arma el paquete que publica YaDominios Cloud:
//   out-deploy/_worker.js   (UN solo archivo, empaquetado por wrangler)
//   out-deploy/<estáticos>  (de .open-next/assets)
//   out-deploy/schema.sql   (la plataforma lo ejecuta en cada publicación)
//   out-deploy/yadominios.json
// Uso: npm run cf:bundle            (compila y empaqueta)
//      npm run cf:bundle -- --sin-build   (solo empaqueta lo ya compilado)
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import semver from "semver";

const raiz = process.cwd();
const correr = (cmd) =>
  execSync(cmd, { stdio: "inherit", cwd: raiz, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
const leerJson = (p) => JSON.parse(readFileSync(path.join(raiz, p), "utf8"));

// 1. Par de versiones Next ↔ adaptador (el rango tiene un hueco que se mueve).
const rango = leerJson("node_modules/@opennextjs/cloudflare/package.json").peerDependencies?.next;
const mia = leerJson("node_modules/next/package.json").version;
if (!rango || !mia) {
  console.error("No se pudieron leer las versiones de Next y del adaptador. Se para.");
  process.exit(1);
}
if (!semver.satisfies(mia, rango)) {
  console.error(`Next ${mia} NO lo acepta @opennextjs/cloudflare, que exige: ${rango}`);
  process.exit(1);
}
console.info(`Versiones compatibles: next ${mia} dentro de ${rango}`);

// 2. Compilar.
if (!process.argv.includes("--sin-build")) correr("npx opennextjs-cloudflare build");

// 3. Empaquetar en UN archivo con wrangler (--dry-run no toca ninguna cuenta).
rmSync(path.join(raiz, ".dist-worker"), { recursive: true, force: true });
correr("npx wrangler deploy --dry-run --outdir=.dist-worker --minify");

// 4. Armar la carpeta publicable.
const salida = path.join(raiz, "out-deploy");
rmSync(salida, { recursive: true, force: true });
mkdirSync(salida);
const extras = readdirSync(path.join(raiz, ".dist-worker")).filter(
  (f) => f !== "worker.js" && !f.endsWith(".map") && f !== "README.md",
);
if (extras.length) {
  console.error(
    `El empaquetado dejó módulos aparte (${extras.join(", ")}): el _worker.js no sería autónomo.`,
  );
  process.exit(1);
}
cpSync(path.join(raiz, ".dist-worker/worker.js"), path.join(salida, "_worker.js"));
cpSync(path.join(raiz, ".open-next/assets"), salida, { recursive: true });
cpSync(path.join(raiz, "schema.sql"), path.join(salida, "schema.sql"));
cpSync(path.join(raiz, "yadominios.json"), path.join(salida, "yadominios.json"));

// 5. Topes de la plataforma: 10 MB en gzip y 64 MB en crudo.
const crudo = statSync(path.join(salida, "_worker.js")).size;
const gz = gzipSync(readFileSync(path.join(salida, "_worker.js"))).length;
const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";
console.info(`_worker.js: ${mb(crudo)} en crudo, ${mb(gz)} en gzip`);
if (gz > 10 * 1024 * 1024 || crudo > 64 * 1024 * 1024) {
  console.error("El paquete pasa los topes de YaDominios Cloud (10 MB gzip / 64 MB crudo).");
  process.exit(1);
}
if (!existsSync(path.join(salida, "_worker.js"))) process.exit(1);
console.info("Paquete listo en out-deploy/");
