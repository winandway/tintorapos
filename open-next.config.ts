// Sin caché incremental: YaDominios Cloud no ofrece las bindings que usa
// (R2/KV/DO de caché). Todas las páginas de la app son dinámicas.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
