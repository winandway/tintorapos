import { randomUUID } from "node:crypto";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { ProveedorTostadas } from "@/components/ui/aviso";
import { diccionario, type Idioma } from "@/lib/i18n";
import { ProveedorIdioma } from "@/lib/i18n/cliente";
import { leerCatalogo } from "@/server/catalogo";
import { registrarTintoreria } from "@/server/cuentas/registro";
import { crearOrden, esquemaNuevaOrden, type DatosNuevaOrden } from "@/server/ordenes/crear";
import { sesionPara } from "./fabrica";
import { sesionDe } from "./sesion";

export const d = diccionario("es");

/** Una tintorería registrada de verdad (con su catálogo estándar), con precios y sesión del dueño. */
export async function escenarioPantallas(db: D1Database) {
  const ahora = Date.now();
  const r = await registrarTintoreria(db, {
    negocio: "Tintorería Pantallas",
    nombre: "Dueña Pantallas",
    correo: `pantallas-${randomUUID().slice(0, 8)}@ejemplo.com`,
    clave: "Clave-segura-2026",
    zonaHoraria: "America/New_York",
    idioma: "es",
    pais: "US",
    moneda: "USD",
  });
  const cat = await leerCatalogo(db, r.tintoreriaId);
  const seco = cat.servicios.find((s) => s.nombreEs === "Lavado en seco")!;
  const libra = cat.servicios.find((s) => s.unidad === "libra")!;
  const camisa = cat.prendas.find((p) => p.nombreEs === "Camisa")!;
  const pantalon = cat.prendas.find((p) => p.nombreEs === "Pantalón")!;
  await db.batch([
    db
      .prepare(
        "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, 500, ?)",
      )
      .bind(r.tintoreriaId, seco.id, camisa.id, ahora),
    db
      .prepare(
        "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, 750, ?)",
      )
      .bind(r.tintoreriaId, seco.id, pantalon.id, ahora),
    db
      .prepare(
        "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, '', 199, ?)",
      )
      .bind(r.tintoreriaId, libra.id, ahora),
  ]);
  const token = await sesionPara(db, r.tintoreriaId, r.usuarioId);
  const sesion = await sesionDe(db, token);

  let celulares = 0;
  async function nuevaOrden(extra: Partial<DatosNuevaOrden> = {}) {
    celulares += 1;
    // Pasa por el mismo esquema que la ruta: así se llenan los valores por defecto.
    return crearOrden(
      db,
      sesion,
      esquemaNuevaOrden.parse({
        id: randomUUID(),
        cliente: {
          nuevo: {
            id: randomUUID(),
            nombre: "Cliente",
            apellido: "Pantallas",
            telefono: `305556${String(celulares).padStart(4, "0")}`,
            idioma: "es",
            preferencias: {},
            aceptaSms: false,
            aceptaCorreo: false,
          },
        },
        prendas: [
          { id: randomUUID(), servicioId: seco.id, prendaId: camisa.id, cantidad: 1 },
          { id: randomUUID(), servicioId: seco.id, prendaId: pantalon.id, cantidad: 1 },
        ],
        urgente: false,
        ...extra,
      }),
    );
  }

  return { ...r, token, sesion, cat, seco, libra, camisa, pantalon, nuevaOrden };
}

export function montar(ui: ReactNode, idioma: Idioma = "es") {
  return render(
    <ProveedorIdioma idioma={idioma} d={diccionario(idioma)}>
      <ProveedorTostadas>{ui}</ProveedorTostadas>
    </ProveedorIdioma>,
  );
}
