/**
 * Datos de trabajo para VER las pantallas en la computadora mientras se diseñan.
 * Escribe SOLO en la base local de desarrollo (`wrangler d1 --local`): nunca toca
 * la base publicada ni entra al paquete que se sube. Al terminar imprime la cookie
 * de sesión para pegarla en el navegador.
 *
 *   node scripts/demo-local.mjs
 */
import { execFileSync } from "node:child_process";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { PRENDAS_ESTANDAR, SERVICIOS_ESTANDAR } from "../src/server/catalogo/estandar.ts";

const AHORA = Date.now();
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const txt = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// Precios de trabajo (centavos) por servicio y prenda: solo para ver la pantalla.
const PRECIO = {
  seco: 899,
  lavado_planchado: 399,
  planchado: 299,
  libra: 199,
  arreglos: 1200,
};

function ejecutar(sql) {
  execFileSync("npx", ["wrangler", "d1", "execute", "DB", "--local", "--yes", `--command=${sql}`], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}

const tintoreriaId = randomUUID();
const sucursalId = randomUUID();
const duenoId = randomUUID();
const token = randomBytes(32).toString("hex");

const filas = [
  `insert into tintorerias (id, nombre, telefono, pais, zona_horaria, moneda, idioma, impuesto_bps, dias_entrega, plan, prueba_hasta, proximo_numero, creada_en, actualizada_en)
   values (${txt(tintoreriaId)}, 'Tintorería de trabajo (local)', '3055550100', 'US', 'America/New_York', 'USD', 'es', 700, 2, 'prueba', ${AHORA + 14 * 86400000}, 1001, ${AHORA}, ${AHORA})`,
  `insert into sucursales (id, tintoreria_id, nombre, activa, creada_en)
   values (${txt(sucursalId)}, ${txt(tintoreriaId)}, 'Principal', 1, ${AHORA})`,
  `insert into usuarios (id, tintoreria_id, nombre, rol, correo, totp_activo, activo, creado_en, actualizado_en)
   values (${txt(duenoId)}, ${txt(tintoreriaId)}, 'Soporte Windoce', 'dueno', 'soporte@windoce.com', 0, 1, ${AHORA}, ${AHORA})`,
  `insert into sesiones (id_hash, tintoreria_id, usuario_id, dispositivo_id, tipo, segundo_factor_ok, creada_en, ultima_actividad_en, expira_en)
   values (${txt(sha256(token))}, ${txt(tintoreriaId)}, ${txt(duenoId)}, null, 'cuenta', 1, ${AHORA}, ${AHORA}, ${AHORA + 30 * 86400000})`,
];

const servicios = SERVICIOS_ESTANDAR.map((s, i) => ({ ...s, id: randomUUID(), orden: i }));
const prendas = PRENDAS_ESTANDAR.map((p, i) => ({ ...p, id: randomUUID(), orden: i }));

for (const s of servicios)
  filas.push(
    `insert into catalogo_servicios (id, tintoreria_id, nombre_es, nombre_en, unidad, aplica_impuesto, orden, activo, creado_en)
     values (${txt(s.id)}, ${txt(tintoreriaId)}, ${txt(s.es)}, ${txt(s.en)}, ${txt(s.unidad)}, ${s.impuesto ? 1 : 0}, ${s.orden}, 1, ${AHORA})`,
  );
for (const p of prendas)
  filas.push(
    `insert into catalogo_prendas (id, tintoreria_id, nombre_es, nombre_en, orden, activo, creado_en)
     values (${txt(p.id)}, ${txt(tintoreriaId)}, ${txt(p.es)}, ${txt(p.en)}, ${p.orden}, 1, ${AHORA})`,
  );
for (const s of servicios) {
  const base = PRECIO[s.clave] ?? 500;
  if (s.unidad === "libra") {
    filas.push(
      `insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en)
       values (${txt(tintoreriaId)}, ${txt(s.id)}, '', ${base}, ${AHORA})`,
    );
    continue;
  }
  for (const [i, p] of prendas.entries())
    filas.push(
      `insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en)
       values (${txt(tintoreriaId)}, ${txt(s.id)}, ${txt(p.id)}, ${base + i * 100}, ${AHORA})`,
    );
}

for (const [i, c] of [
  ["Ana", "Martínez", "3055550111"],
  ["Luis", "Gómez", "3055550122"],
  ["Carla", "Rivas", "3055550133"],
].entries())
  filas.push(
    `insert into clientes (id, tintoreria_id, nombre, apellido, telefono, telefono_digitos, idioma, acepta_sms, acepta_correo, creado_en, actualizado_en)
     values (${txt(randomUUID())}, ${txt(tintoreriaId)}, ${txt(c[0])}, ${txt(c[1])}, ${txt(c[2])}, ${txt(c[2])}, 'es', 1, 1, ${AHORA - i * 1000}, ${AHORA - i * 1000})`,
  );

for (const sql of filas) ejecutar(sql);

console.log("Listo. En el navegador, en https://localhost o http://localhost:3000, pega estas cookies:");
console.log(`tp_sesion=${token}`);
console.log("tp_csrf=demo-local-0123456789");
