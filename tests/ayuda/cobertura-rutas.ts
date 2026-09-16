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
  "/datos/clave/cambiar": {
    casos: () => [{ metodo: "POST", cuerpo: { actual: "no-es", nueva: "Otra-Clave-2026" } }],
  },
  "/datos/clave/recuperar": { publica: "solo recibe un correo y siempre responde lo mismo" },
  "/datos/clave/restablecer": { publica: "solo recibe un token secreto de 256 bits" },
  "/datos/dispositivos": {
    casos: () => [
      { metodo: "GET", esperado: [200] },
      { metodo: "POST", cuerpo: { nombre: "Tablet B" }, esperado: [200] },
    ],
  },
  "/datos/dispositivos/[id]": { casos: (e) => [{ metodo: "DELETE", params: { id: e.a.dispositivoId } }] },
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
