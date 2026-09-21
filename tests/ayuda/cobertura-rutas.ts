import type { Escenario } from "./escenario";

export interface CasoAislamiento {
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  cuerpo?: unknown;
  url?: string;
  /** Con qué credencial de la tintorería B se ataca (por defecto, la sesión del dueño de B). */
  como?: "sesionB" | "dispositivoB";
  /** Estados aceptables. Por defecto 400/403/404. */
  esperado?: number[];
}

export type Cobertura = { publica: string } | { casos: (e: Escenario) => CasoAislamiento[] };

/**
 * Cada ruta del backend y cómo se ataca desde la tintorería B apuntando a datos de A.
 * Las rutas que no leen datos de una tintorería concreta se declaran públicas con su motivo.
 */
export const COBERTURA: Record<string, Cobertura> = {
  "/datos/registro": { publica: "crea una tintorería nueva; no recibe identificadores de otra" },
  "/datos/sesion": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/sesion/entrar": { publica: "solo recibe correo y contraseña" },
  "/datos/sesion/salir": { casos: () => [{ metodo: "POST", esperado: [200] }] },
  "/datos/sesion/dos-pasos/iniciar": { casos: () => [{ metodo: "POST", esperado: [200] }] },
  "/datos/sesion/dos-pasos/activar": {
    casos: () => [{ metodo: "POST", cuerpo: { codigo: "000000" }, esperado: [400, 409] }],
  },
  "/datos/sesion/dos-pasos/verificar": {
    casos: () => [{ metodo: "POST", cuerpo: { codigo: "000000" }, esperado: [400, 409] }],
  },
  "/datos/sesion/dos-pasos/respaldos": {
    casos: () => [{ metodo: "POST", cuerpo: { codigo: "000000" }, esperado: [400, 409] }],
  },
  "/datos/clave/cambiar": {
    casos: () => [{ metodo: "POST", cuerpo: { actual: "no-es", nueva: "Otra-Clave-2026" } }],
  },
  "/datos/clave/recuperar": { publica: "solo recibe un correo y siempre responde lo mismo" },
  "/datos/demo": {
    publica: "crea una tintorería de demostración nueva; no recibe identificadores de otra",
  },
  "/datos/contacto": {
    publica: "formulario público: solo nombre, correo y mensaje; no recibe identificadores",
  },
  "/datos/cuenta/verificacion": {
    casos: () => [{ metodo: "POST", esperado: [200, 400] }],
  },
  "/datos/clave/restablecer": { publica: "solo recibe un token secreto de 256 bits" },
  "/datos/dispositivos": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { nombre: "Tablet B" }, esperado: [200] },
    ],
  },
  "/datos/dispositivos/enlace": {
    casos: () => [{ metodo: "POST", cuerpo: { nombre: "Celular B" }, esperado: [200] }],
  },
  "/datos/dispositivos/[id]": { casos: (e) => [{ metodo: "DELETE", params: { id: e.a.dispositivoId } }] },
  "/datos/publico/orden/[codigo]": {
    publica: "el código del recibo ES la llave; devuelve estado y nada personal (ver publico.test.ts)",
  },
  "/datos/pin/empleados": { casos: () => [{ metodo: "GET", como: "dispositivoB", esperado: [200] }] },
  "/datos/pin/entrar": {
    casos: (e) => [
      {
        metodo: "POST",
        como: "dispositivoB",
        cuerpo: { usuarioId: e.a.duenoId, pin: "4829" },
        esperado: [401],
      },
    ],
  },
  "/datos/auditoria": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/pin/autorizadores": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/ajustes/tienda": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "PUT", cuerpo: { nombre: "x" } },
    ],
  },
  "/datos/catalogo": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/catalogo/prendas": {
    casos: () => [{ metodo: "POST", cuerpo: { nombreEs: "Prenda B" }, esperado: [200] }],
  },
  "/datos/catalogo/prendas/[id]": {
    casos: (e) => [
      { metodo: "PUT", params: { id: e.a.ids.prendaId! }, cuerpo: { nombreEs: "Robada", activo: false } },
    ],
  },
  "/datos/catalogo/servicios": {
    casos: () => [
      {
        metodo: "POST",
        cuerpo: { nombreEs: "Servicio B", unidad: "pieza", aplicaImpuesto: true },
        esperado: [200],
      },
    ],
  },
  "/datos/catalogo/servicios/[id]": {
    casos: (e) => [
      {
        metodo: "PUT",
        params: { id: e.a.ids.servicioId! },
        cuerpo: { nombreEs: "Robado", unidad: "pieza", aplicaImpuesto: false },
      },
    ],
  },
  "/datos/catalogo/precios": {
    casos: (e) => [
      {
        metodo: "PUT",
        cuerpo: { precios: [{ servicioId: e.a.ids.servicioId, prendaId: e.a.ids.prendaId, precioCents: 1 }] },
      },
      {
        metodo: "PUT",
        cuerpo: { precios: [{ servicioId: e.b.ids.servicioId, prendaId: e.a.ids.prendaId, precioCents: 1 }] },
      },
    ],
  },
  "/datos/clientes": {
    casos: () => [
      { metodo: "GET", url: "/datos/clientes?q=3125550199", esperado: [200] },
      { metodo: "GET", url: "/datos/clientes?q=marca-unica-aaaa", esperado: [200] },
      {
        metodo: "POST",
        cuerpo: { nombre: "Cliente nuevo B", idioma: "es", telefono: "3125550111" },
        esperado: [200],
      },
    ],
  },
  "/datos/clientes/[id]": {
    casos: (e) => [
      { metodo: "GET", params: { id: e.a.ids.clienteId! } },
      { metodo: "PUT", params: { id: e.a.ids.clienteId! }, cuerpo: { nombre: "Robado", idioma: "en" } },
      { metodo: "DELETE", params: { id: e.a.ids.clienteId! } },
    ],
  },
  "/datos/clientes/[id]/restaurar": {
    casos: (e) => [{ metodo: "POST", params: { id: e.a.ids.clienteId! } }],
  },
  "/datos/ordenes": {
    casos: (e) => [
      { metodo: "GET", url: "/datos/ordenes?estado=todas", esperado: [200] },
      {
        metodo: "POST",
        cuerpo: {
          id: "11111111-1111-4111-8111-111111111111",
          cliente: { id: e.a.ids.clienteId },
          prendas: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              prendaId: e.b.ids.prendaId,
              servicioId: e.b.ids.servicioId,
              cantidad: 1,
            },
          ],
        },
      },
      {
        metodo: "POST",
        cuerpo: {
          id: "33333333-3333-4333-8333-333333333333",
          cliente: { id: e.b.ids.clienteId },
          prendas: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              prendaId: e.a.ids.prendaId,
              servicioId: e.a.ids.servicioId,
              cantidad: 1,
            },
          ],
        },
      },
      {
        metodo: "POST",
        cuerpo: {
          id: e.a.ids.ordenId,
          cliente: { id: e.b.ids.clienteId },
          prendas: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              prendaId: e.b.ids.prendaId,
              servicioId: e.b.ids.servicioId,
              cantidad: 1,
            },
          ],
        },
        esperado: [200, 409],
      },
    ],
  },
  "/datos/ordenes/[id]": { casos: (e) => [{ metodo: "GET", params: { id: e.a.ids.ordenId! } }] },
  "/datos/ordenes/[id]/estado": {
    casos: (e) => [{ metodo: "POST", params: { id: e.a.ids.ordenId! }, cuerpo: { estado: "lista" } }],
  },
  "/datos/ordenes/[id]/entregar": {
    casos: (e) => [{ metodo: "POST", params: { id: e.a.ids.ordenId! }, cuerpo: { forzar: true } }],
  },
  "/datos/ordenes/[id]/anular": {
    casos: (e) => [
      { metodo: "POST", params: { id: e.a.ids.ordenId! }, cuerpo: { motivo: "prueba de ataque" } },
    ],
  },
  "/datos/ordenes/[id]/abandonar": {
    casos: (e) => [{ metodo: "POST", params: { id: e.a.ids.ordenId! }, cuerpo: {} }],
  },
  "/datos/ordenes/[id]/reimpresion": {
    casos: (e) => [{ metodo: "POST", params: { id: e.a.ids.ordenId! }, cuerpo: { tipo: "etiquetas" } }],
  },
  "/datos/ordenes/[id]/pagos": {
    casos: (e) => [
      {
        metodo: "POST",
        params: { id: e.a.ids.ordenId! },
        cuerpo: { id: "66666666-6666-4666-8666-666666666666", metodo: "otro", montoCents: 1 },
      },
      {
        metodo: "POST",
        params: { id: e.b.ids.ordenId! },
        cuerpo: { id: e.a.ids.pagoId, metodo: "otro", montoCents: 1 },
        esperado: [409],
      },
    ],
  },
  "/datos/pagos/[id]/anular": {
    casos: (e) => [
      { metodo: "POST", params: { id: e.a.ids.pagoId! }, cuerpo: { motivo: "prueba de ataque" } },
    ],
  },
  "/datos/escaneo": {
    casos: (e) => [
      { metodo: "GET", url: `/datos/escaneo?codigo=${e.a.ids.codigoPublico}` },
      { metodo: "GET", url: "/datos/escaneo?codigo=1001", esperado: [200] },
    ],
  },
  "/datos/caja": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { fondoCents: 1 }, esperado: [200, 409] },
    ],
  },
  "/datos/caja/movimientos": {
    casos: () => [
      { metodo: "POST", cuerpo: { tipo: "entrada", montoCents: 1, motivo: "prueba" }, esperado: [200, 409] },
    ],
  },
  "/datos/caja/cerrar": {
    casos: () => [{ metodo: "POST", cuerpo: { contadoCents: 1 }, esperado: [200, 409] }],
  },
  "/datos/caja/turnos": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/fotos": {
    publica:
      "cubierta en tests/integracion/fotos.test.ts (multipart: sube a una orden de la otra tintorería → 404)",
  },
  "/datos/fotos/[id]": { casos: (e) => [{ metodo: "DELETE", params: { id: e.a.ids.fotoId! } }] },
  "/media/fotos/[id]": { casos: (e) => [{ metodo: "GET", params: { id: e.a.ids.fotoId! } }] },
  "/datos/avisos": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/avisos/plantillas": {
    casos: () => [{ metodo: "PUT", cuerpo: { lista: { activo: false } }, esperado: [200] }],
  },
  "/datos/avisos/prueba": {
    casos: () => [
      { metodo: "POST", cuerpo: { canal: "correo", destino: "prueba@ejemplo.com" }, esperado: [200] },
    ],
  },
  "/datos/webhooks/twilio": {
    publica: "no recibe sesión; exige la firma de Twilio (tests/integracion/avisos.test.ts)",
  },
  "/datos/reloj": {
    publica:
      "solo con el secreto del reloj; recorre todas las tintorerías por diseño (tests/integracion/reloj-respaldos.test.ts)",
  },
  "/datos/exportar": {
    casos: () => [
      { metodo: "GET", url: "/datos/exportar?formato=json", esperado: [200] },
      { metodo: "GET", url: "/datos/exportar?formato=csv&tabla=clientes", esperado: [200] },
    ],
  },
  "/datos/respaldos": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/reportes": {
    casos: () => [
      { metodo: "GET", url: "/datos/reportes?preset=30", esperado: [200] },
      {
        metodo: "GET",
        url: "/datos/reportes?desde=2000-01-01&hasta=2999-12-31&formato=csv",
        esperado: [200],
      },
    ],
  },
  "/datos/reportes/operacion": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/sync": {
    casos: (e) => [
      {
        metodo: "POST",
        cuerpo: {
          ops: [
            {
              id: "77777777-7777-4777-8777-777777777777",
              tipo: "estado",
              ordenId: e.a.ids.ordenId,
              cuerpo: { estado: "lista" },
              creadoEn: Date.now(),
            },
          ],
        },
        esperado: [200],
      },
      {
        metodo: "POST",
        cuerpo: {
          ops: [
            {
              id: "88888888-8888-4888-8888-888888888888",
              tipo: "pago",
              ordenId: e.a.ids.ordenId,
              cuerpo: { id: "99999999-9999-4999-8999-999999999999", metodo: "efectivo", montoCents: 1 },
              creadoEn: Date.now(),
            },
          ],
        },
        esperado: [200],
      },
    ],
  },
  "/datos/mostrador/cache": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/contabilidad/resumen": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/contabilidad/impuestos": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/contabilidad/cobrar": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/contabilidad/exportar": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/contabilidad/gastos": {
    casos: (e) => [
      { metodo: "GET", esperado: [200] },
      {
        metodo: "POST",
        cuerpo: {
          gasto: {
            fecha: "2026-09-10",
            categoria: "luz",
            montoCents: 100,
            metodoPago: "efectivo",
            proveedorId: e.a.ids.proveedorId,
          },
        },
      },
    ],
  },
  "/datos/contabilidad/gastos/[id]": {
    casos: (e) => [
      {
        metodo: "PUT",
        params: { id: e.a.ids.gastoId ?? "" },
        cuerpo: {
          gasto: { fecha: "2026-09-10", categoria: "luz", montoCents: 1, metodoPago: "efectivo" },
        },
      },
      { metodo: "DELETE", params: { id: e.a.ids.gastoId ?? "" } },
    ],
  },
  "/datos/contabilidad/proveedores": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { proveedor: { nombre: "Proveedor B", terminosDias: 0 } }, esperado: [200] },
    ],
  },
  "/datos/contabilidad/proveedores/[id]": {
    casos: (e) => [
      {
        metodo: "PUT",
        params: { id: e.a.ids.proveedorId ?? "" },
        cuerpo: { proveedor: { nombre: "Robado", terminosDias: 0 } },
      },
      { metodo: "DELETE", params: { id: e.a.ids.proveedorId ?? "" } },
    ],
  },
  "/datos/contabilidad/insumos": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { insumo: { nombre: "Insumo B", unidad: "caja" } }, esperado: [200] },
    ],
  },
  "/datos/contabilidad/insumos/[id]": {
    casos: (e) => [
      {
        metodo: "PUT",
        params: { id: e.a.ids.insumoId ?? "" },
        cuerpo: { insumo: { nombre: "Robado", unidad: "caja" } },
      },
      { metodo: "POST", params: { id: e.a.ids.insumoId ?? "" }, cuerpo: { cantidad: -5 } },
    ],
  },
  "/datos/contabilidad/compras": {
    casos: (e) => [
      { metodo: "GET", esperado: [200] },
      {
        metodo: "POST",
        cuerpo: {
          compra: {
            proveedorId: e.a.ids.proveedorId,
            fecha: "2026-09-10",
            lineas: [{ insumoId: e.a.ids.insumoId, descripcion: "Robo", cantidad: 1, costoUnitCents: 1 }],
          },
        },
      },
    ],
  },
  "/datos/contabilidad/compras/[id]": {
    casos: (e) => [
      { metodo: "POST", params: { id: e.a.ids.compraId ?? "" }, cuerpo: { montoCents: 100 } },
      { metodo: "DELETE", params: { id: e.a.ids.compraId ?? "" } },
    ],
  },
  // El panel de Windoce: ninguna sesión de tintorería entra (403 para el dueño de B).
  "/datos/admin/resumen": { casos: () => [{ metodo: "GET", esperado: [403] }] },
  "/datos/admin/tintorerias": { casos: () => [{ metodo: "GET", esperado: [403] }] },
  "/datos/admin/tintorerias/[id]": {
    casos: (e) => [{ metodo: "PUT", params: { id: e.a.id }, cuerpo: { plan: "pagado" }, esperado: [403] }],
  },
  "/datos/admin/tickets": { casos: () => [{ metodo: "GET", esperado: [403] }] },
  "/datos/admin/tickets/[id]": {
    casos: (e) => [
      { metodo: "GET", params: { id: e.a.id }, esperado: [403] },
      { metodo: "POST", params: { id: e.a.id }, cuerpo: { mensaje: "hola" }, esperado: [403] },
      { metodo: "PUT", params: { id: e.a.id }, cuerpo: { estado: "cerrado" }, esperado: [403] },
    ],
  },
  "/datos/ordenes/[id]/recibo": { casos: (e) => [{ metodo: "GET", params: { id: e.a.ids.ordenId ?? "" } }] },
  "/datos/salud": { publica: "canario sin datos de ninguna tintorería" },
  "/datos/empleados": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { nombre: "Nuevo B", rol: "planta", pin: "4829" }, esperado: [200] },
    ],
  },
  "/datos/empleados/[id]": {
    casos: (e) => [
      {
        metodo: "PUT",
        params: { id: e.a.ids.empleadoId! },
        cuerpo: { nombre: "Robado", rol: "planta", pin: "4829" },
      },
      { metodo: "PATCH", params: { id: e.a.ids.empleadoId! }, cuerpo: { activo: false } },
    ],
  },
};
