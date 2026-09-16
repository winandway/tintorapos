import { getPlatformProxy } from "wrangler";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { dividirSentencias } from "../../scripts/sql-utils.mjs";

export interface EntornoPrueba {
  env: CloudflareEnv & Record<string, unknown>;
  pendientes: Promise<unknown>[];
  esperar: () => Promise<void>;
  cerrar: () => Promise<void>;
}

/**
 * Base de datos D1 y almacén R2 REALES (motor local de Cloudflare) en memoria,
 * con schema.sql aplicado. Una instancia por archivo de prueba.
 */
export async function crearEntorno(extra: Record<string, unknown> = {}): Promise<EntornoPrueba> {
  const proxy = await getPlatformProxy<CloudflareEnv>({
    configPath: path.resolve(import.meta.dirname, "../../wrangler.jsonc"),
    persist: false,
    envFiles: [],
  });
  const DB = proxy.env.DB;
  const BUCKET = proxy.env.BUCKET;
  const esquema = path.resolve(import.meta.dirname, "../../schema.sql");
  let sql = "";
  try {
    sql = readFileSync(esquema, "utf8");
  } catch {
    sql = "";
  }
  const sentencias = dividirSentencias(sql);
  for (const s of sentencias) await DB.prepare(s).run();

  const pendientes: Promise<unknown>[] = [];
  const env = {
    DB,
    BUCKET,
    ASSETS: undefined as unknown as Fetcher,
    // Valores generados en cada corrida: ningún secreto fijo en el repo.
    APP_SECRET: randomBytes(32).toString("hex"),
    APP_URL: "https://tintora.prueba",
    RELOJ_SECRETO: randomBytes(16).toString("hex"),
    BACKUP_KEY: randomBytes(32).toString("base64"),
    ...extra,
  } as unknown as EntornoPrueba["env"];
  return {
    env,
    pendientes,
    esperar: async () => {
      while (pendientes.length) await Promise.allSettled(pendientes.splice(0));
    },
    cerrar: () => proxy.dispose(),
  };
}
