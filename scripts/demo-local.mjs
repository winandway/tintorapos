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
import { codigoEtiqueta, codigoPublico } from "../src/lib/codigos.ts";

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
   values (${txt(duenoId)}, ${txt(tintoreriaId)}, 'Soporte Windoce', 'dueno', ${txt(`soporte+${AHORA}@windoce.com`)}, 0, 1, ${AHORA}, ${AHORA})`,
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

// Un día de trabajo de verdad: órdenes en todos los estados, con sus prendas,
// sus pagos y la caja abierta. Sin esto, las pantallas se ven vacías.
const clientes = [
  { id: randomUUID(), nombre: "Ana", apellido: "Martínez", tel: "3055550111" },
  { id: randomUUID(), nombre: "Luis", apellido: "Gómez", tel: "3055550122" },
  { id: randomUUID(), nombre: "Carla", apellido: "Rivas", tel: "3055550133" },
  { id: randomUUID(), nombre: "Marta", apellido: "Ochoa", tel: "3055550144" },
  { id: randomUUID(), nombre: "Diego", apellido: "Salas", tel: "3055550155" },
];
filas.length = filas.length; // (las filas de clientes se arman abajo)

const turnoId = randomUUID();
filas.push(
  `insert into turnos_caja (id, tintoreria_id, sucursal_id, dispositivo_id, estado, abierto_por, abierto_en, fondo_cents)
   values (${txt(turnoId)}, ${txt(tintoreriaId)}, ${txt(sucursalId)}, null, 'abierto', ${txt(duenoId)}, ${AHORA - 6 * 3600000}, 10000)`,
);

const DIA = 86400000;
const PEDIDOS = [
  { cliente: 0, estado: "lista", piezas: ["Camisa", "Camisa", "Pantalón"], pagado: "parcial", horas: 26 },
  { cliente: 1, estado: "en_proceso", piezas: ["Saco o blazer", "Corbata"], pagado: "no", horas: 20 },
  { cliente: 2, estado: "recibida", piezas: ["Vestido", "Falda", "Blusa"], pagado: "total", horas: 4 },
  { cliente: 3, estado: "lista", piezas: ["Edredón"], pagado: "no", horas: 30, urgente: 1 },
  {
    cliente: 4,
    estado: "entregada",
    piezas: ["Camisa", "Camisa", "Camisa", "Pantalón"],
    pagado: "total",
    horas: 50,
  },
  { cliente: 0, estado: "recibida", piezas: ["Abrigo"], pagado: "no", horas: 2 },
  { cliente: 1, estado: "en_proceso", piezas: ["Cortinas", "Mantel"], pagado: "parcial", horas: 12 },
  { cliente: 2, estado: "entregada", piezas: ["Traje de 2 piezas"], pagado: "total", horas: 70 },
];

const precioDe = (nombre) => {
  const i = prendas.findIndex((p) => p.es === nombre);
  return (PRECIO.seco ?? 899) + (i < 0 ? 0 : i * 100);
};

let numero = 1001;
for (const [i, c] of clientes.entries())
  filas.push(
    `insert into clientes (id, tintoreria_id, nombre, apellido, telefono, telefono_digitos, idioma, acepta_sms, acepta_correo, creado_en, actualizado_en)
     values (${txt(c.id)}, ${txt(tintoreriaId)}, ${txt(c.nombre)}, ${txt(c.apellido)}, ${txt(c.tel)}, ${txt(c.tel)}, 'es', 1, 1, ${AHORA - i * 1000}, ${AHORA - i * 1000})`,
  );

const servicioSeco = servicios.find((s) => s.clave === "seco");
for (const p of PEDIDOS) {
  const ordenId = randomUUID();
  const creada = AHORA - p.horas * 3600000;
  const subtotal = p.piezas.reduce((t, n) => t + precioDe(n), 0);
  const recargo = p.urgente ? Math.round(subtotal * 0.5) : 0;
  const impuesto = Math.round((subtotal + recargo) * 0.07);
  const total = subtotal + recargo + impuesto;
  const pagado = p.pagado === "total" ? total : p.pagado === "parcial" ? Math.round(total / 2) : 0;
  const fecha = new Date(creada).toISOString().slice(0, 10);
  filas.push(
    `insert into ordenes (id, tintoreria_id, sucursal_id, numero, codigo_publico, cliente_id, estado, urgente, fecha_promesa,
       subtotal_cents, recargo_cents, impuesto_cents, total_cents, pagado_cents, impuesto_bps, recargo_bps,
       creada_por, origen, fecha_local, creada_en, actualizada_en, lista_en, entregada_en)
     values (${txt(ordenId)}, ${txt(tintoreriaId)}, ${txt(sucursalId)}, ${numero}, ${txt(codigoPublico())}, ${txt(clientes[p.cliente].id)},
       ${txt(p.estado)}, ${p.urgente ?? 0}, ${creada + 2 * DIA}, ${subtotal}, ${recargo}, ${impuesto}, ${total}, ${pagado}, 700, ${p.urgente ? 5000 : 0},
       ${txt(duenoId)}, 'en_linea', ${txt(fecha)}, ${creada}, ${creada},
       ${p.estado === "lista" || p.estado === "entregada" ? creada + 3600000 : "null"},
       ${p.estado === "entregada" ? creada + 7200000 : "null"})`,
  );
  for (const [j, nombrePrenda] of p.piezas.entries()) {
    const prenda = prendas.find((x) => x.es === nombrePrenda);
    const estadoPieza =
      p.estado === "entregada"
        ? "entregada"
        : p.estado === "lista"
          ? "lista"
          : p.estado === "en_proceso"
            ? "en_proceso"
            : "recibida";
    filas.push(
      `insert into orden_prendas (id, tintoreria_id, orden_id, prenda_id, servicio_id, prenda_es, prenda_en, servicio_es, servicio_en,
         unidad, cantidad, precio_unit_cents, total_cents, aplica_impuesto, color, notas, codigo_etiqueta, estado, ubicacion, posicion, creada_en, actualizada_en)
       values (${txt(randomUUID())}, ${txt(tintoreriaId)}, ${txt(ordenId)}, ${txt(prenda?.id ?? null)}, ${txt(servicioSeco?.id ?? null)},
         ${txt(nombrePrenda)}, ${txt(prenda?.en ?? nombrePrenda)}, 'Lavado en seco', 'Dry cleaning', 'pieza', 1,
         ${precioDe(nombrePrenda)}, ${precioDe(nombrePrenda)}, 1, ${j === 0 ? "'Azul oscuro'" : "null"}, ${j === 0 ? "'Botón roto'" : "null"},
         ${txt(codigoEtiqueta())}, ${txt(estadoPieza)}, ${estadoPieza === "lista" ? "'B-12'" : "null"}, ${j}, ${creada}, ${creada})`,
    );
  }
  if (pagado > 0)
    filas.push(
      `insert into pagos (id, tintoreria_id, orden_id, turno_id, metodo, monto_cents, usuario_id, origen, fecha_local, creado_en)
       values (${txt(randomUUID())}, ${txt(tintoreriaId)}, ${txt(ordenId)}, ${txt(turnoId)},
         ${txt(numero % 3 === 0 ? "tarjeta_externa" : "efectivo")}, ${pagado}, ${txt(duenoId)}, 'en_linea', ${txt(fecha)}, ${creada})`,
    );
  numero += 1;
}
filas.push(`update tintorerias set proximo_numero = ${numero} where id = ${txt(tintoreriaId)}`);

for (const sql of filas) ejecutar(sql);

console.log("Listo. En el navegador, en https://localhost o http://localhost:3000, pega estas cookies:");
console.log(`tp_sesion=${token}`);
console.log("tp_csrf=demo-local-0123456789");
