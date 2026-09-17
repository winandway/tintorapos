import { describe, expect, it } from "vitest";
import {
  agrupar,
  carritoVacio,
  claveGrupo,
  conteoPorBoton,
  diasEntregaCarrito,
  notasDePieza,
  reducirCarrito,
  totalesCarrito,
  type Accion,
  type Carrito,
  type ServicioCarrito,
} from "@/lib/mostrador/carrito";
import { esCodigoValido } from "@/lib/codigos";

const servicios = new Map<string, ServicioCarrito>([
  [
    "seco",
    {
      id: "seco",
      nombreEs: "Seco",
      nombreEn: null,
      unidad: "pieza",
      aplicaImpuesto: true,
      diasEntrega: null,
    },
  ],
  [
    "libra",
    {
      id: "libra",
      nombreEs: "Libra",
      nombreEn: null,
      unidad: "libra",
      aplicaImpuesto: false,
      diasEntrega: 1,
    },
  ],
  [
    "novia",
    {
      id: "novia",
      nombreEs: "Novia",
      nombreEn: null,
      unidad: "pieza",
      aplicaImpuesto: true,
      diasEntrega: 10,
    },
  ],
]);
const reglas = { impuestoBps: 825, recargoUrgenteBps: 5000, descuentoMaxBps: 1000 };

function aplicar(acciones: Accion[], inicio: Carrito = carritoVacio()) {
  return acciones.reduce(reducirCarrito, inicio);
}

const camisa: Accion = {
  tipo: "agregar",
  prendaId: "camisa",
  servicioId: "seco",
  precioUnitCents: 399,
  precioManual: false,
  unidad: "pieza",
};

describe("carrito del mostrador", () => {
  it("agrega piezas con id y código de etiqueta propios, y las agrupa", () => {
    const c = aplicar([
      camisa,
      camisa,
      camisa,
      {
        tipo: "agregar",
        prendaId: null,
        servicioId: "libra",
        precioUnitCents: 175,
        precioManual: false,
        cantidad: 12.345,
        unidad: "libra",
      },
    ]);
    expect(c.piezas).toHaveLength(4);
    expect(new Set(c.piezas.map((p) => p.id)).size).toBe(4);
    expect(c.piezas.every((p) => esCodigoValido(p.codigoEtiqueta, 12))).toBe(true);
    expect(c.piezas[3]!.cantidad).toBe(12.35);
    const grupos = agrupar(c.piezas);
    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toMatchObject({ cantidadTotal: 3, totalCents: 1197 });
    expect(grupos[1]).toMatchObject({ cantidadTotal: 12.35, totalCents: 2161 });
    expect(conteoPorBoton(c.piezas).get("seco|camisa")).toBe(3);
  });

  it("quita una, quita el grupo y cambia el precio del grupo", () => {
    let c = aplicar([camisa, camisa]);
    const clave = claveGrupo(c.piezas[0]!);
    c = reducirCarrito(c, { tipo: "quitarUna", clave });
    expect(c.piezas).toHaveLength(1);
    expect(reducirCarrito(c, { tipo: "quitarUna", clave: "no|existe|0" })).toBe(c);
    c = aplicar([camisa, { tipo: "precioGrupo", clave, precioUnitCents: 450, precioManual: true }], c);
    expect(c.piezas.every((p) => p.precioUnitCents === 450 && p.precioManual)).toBe(true);
    c = reducirCarrito(c, { tipo: "quitarGrupo", clave: claveGrupo(c.piezas[0]!) });
    expect(c.piezas).toHaveLength(0);
  });

  it("edita detalles de una pieza y opciones de la orden; vaciar reinicia", () => {
    let c = aplicar([camisa]);
    const id = c.piezas[0]!.id;
    c = aplicar(
      [
        { tipo: "editarPieza", id, cambios: { color: "Azul", notas: "Mancha" } },
        { tipo: "urgente", valor: true },
        { tipo: "descuento", valor: { tipo: "porcentaje", bps: 1000 }, motivo: "Frecuente" },
        { tipo: "notas", valor: "Sin almidón" },
        { tipo: "fechaPromesa", valor: 123 },
      ],
      c,
    );
    expect(c.piezas[0]).toMatchObject({ color: "Azul", notas: "Mancha" });
    expect(c).toMatchObject({
      urgente: true,
      descuentoMotivo: "Frecuente",
      notas: "Sin almidón",
      fechaPromesa: 123,
    });
    expect(reducirCarrito(c, { tipo: "descuento", valor: null }).descuentoMotivo).toBe("Frecuente");
    expect(reducirCarrito(c, { tipo: "vaciar" })).toEqual(carritoVacio());
  });

  it("calcula totales igual que el servidor y los días de entrega del servicio más lento", () => {
    const c = aplicar([
      camisa,
      camisa,
      {
        tipo: "agregar",
        prendaId: null,
        servicioId: "libra",
        precioUnitCents: 175,
        precioManual: false,
        cantidad: 12.5,
        unidad: "libra",
      },
      { tipo: "urgente", valor: true },
    ]);
    expect(totalesCarrito(c, servicios, reglas)).toMatchObject({
      subtotalCents: 2986,
      recargoCents: 1493,
      impuestoCents: 99,
      totalCents: 4578,
    });
    expect(diasEntregaCarrito(c, servicios, 2)).toBe(2);
    const novia = aplicar([{ ...camisa, servicioId: "novia" }]);
    expect(diasEntregaCarrito(novia, servicios, 2)).toBe(10);
    expect(diasEntregaCarrito(carritoVacio(), servicios, 3)).toBe(3);
    const desconocido = aplicar([{ ...camisa, servicioId: "otro" }]);
    expect(totalesCarrito(desconocido, servicios, reglas).impuestoCents).toBe(33);
  });

  it("las marcas de un toque se ponen y se quitan, y salen juntas en las notas de la pieza", () => {
    const c = aplicar([camisa, camisa]);
    const primera = c.piezas[0]!;
    const conMarcas = [
      { tipo: "marcarPieza", id: primera.id, marca: "Botón roto" } as const,
      { tipo: "marcarPieza", id: primera.id, marca: "Vino" } as const,
      { tipo: "editarPieza", id: primera.id, cambios: { color: "Azul oscuro" } } as const,
      { tipo: "editarPieza", id: primera.id, cambios: { notas: "Sin almidón" } } as const,
    ].reduce(reducirCarrito, c);
    expect(conMarcas.piezas[0]!.marcas).toEqual(["Botón roto", "Vino"]);
    expect(conMarcas.piezas[0]!.color).toBe("Azul oscuro");
    // La segunda pieza no se contagia: cada prenda lleva lo suyo.
    expect(conMarcas.piezas[1]!.marcas).toEqual([]);
    expect(notasDePieza(conMarcas.piezas[0]!)).toBe("Botón roto · Vino · Sin almidón");

    const quitada = reducirCarrito(conMarcas, {
      tipo: "marcarPieza",
      id: primera.id,
      marca: "Vino",
    });
    expect(quitada.piezas[0]!.marcas).toEqual(["Botón roto"]);
  });

  it("el menos del botón de la prenda quita la última de ESA prenda, no otra", () => {
    const pantalon = { ...camisa, prendaId: "pantalon", precioUnitCents: 750 } as const;
    const c = aplicar([camisa, pantalon, camisa]);
    const menos = reducirCarrito(c, {
      tipo: "quitarUltimaDe",
      servicioId: "seco",
      prendaId: "camisa",
    });
    expect(menos.piezas.map((p) => p.prendaId)).toEqual(["camisa", "pantalon"]);
    // Una prenda que no está en el carrito no cambia nada.
    expect(reducirCarrito(menos, { tipo: "quitarUltimaDe", servicioId: "seco", prendaId: "falda" })).toBe(
      menos,
    );
  });
});
