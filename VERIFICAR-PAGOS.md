# VERIFICAR PAGOS — Tintora POS

> Estado REAL de cada pieza de dinero. Se consulta antes de afirmar nada sobre
> cobros y se actualiza en el mismo trabajo que toque cualquier pieza de pago.
> Regla global: prohibido decir «listo» o anunciar a un cliente algo de cobros
> que no se probó de punta a punta.

## 🔴 Resumen en rojo

- 🔴 **NO HAY PROCESADOR DE PAGOS INTEGRADO.** Tintora POS **no cobra tarjetas
  ni mueve dinero**. Solo **registra** los pagos que la tienda ya cobró (en
  efectivo, en su propia terminal de tarjeta o por otro medio).
- 🔴 **NADA de esto está probado en PRODUCCIÓN**: el sitio todavía no está
  publicado. Todo lo de abajo se probó en local (base de pruebas y paquete
  compilado), no con una tienda real.
- 🔴 **No hay suscripción ni cobro a las tintorerías** (Stripe Billing no existe
  todavía). La prueba gratis de 14 días solo muestra un aviso: no bloquea nada al
  terminar.
- **No se le anuncia a ningún cliente que «cobra con tarjeta».** La página
  principal y Docs dicen explícitamente que no procesa tarjetas.

## Estado por pieza

| Pieza | Estado | Cómo se probó (fecha) |
| --- | --- | --- |
| Registrar pago en **efectivo** (al crear la orden, abono o al entregar) | Probado en LOCAL · 🔴 no en producción | 16 sep 2026: `tests/integracion/ordenes-caja.test.ts`, `tests/pantallas/mostrador.test.tsx` (abono con vuelto), `e2e/flujo-completo.spec.ts` (abono $5 y saldo $12.50 al entregar) sobre `next dev` y sobre el `_worker.js` compilado |
| Registrar pago con **tarjeta de la terminal propia** (referencia opcional) | Probado en LOCAL · 🔴 no en producción | 16 sep 2026: `tests/pantallas/mostrador.test.tsx` (todo ahora con tarjeta y referencia), `tests/pantallas/produccion-entrega.test.tsx` (saldo con tarjeta al entregar), `tests/pantallas/ordenes.test.tsx` |
| Registrar pago **otro** (transferencia, app) | Probado en LOCAL (servidor) · 🔴 no en producción | `tests/integracion/ordenes-caja.test.ts` |
| **Pago sin conexión** (se sube al volver internet, sin duplicados) | Probado en LOCAL · 🔴 no en producción | `tests/integracion/sync.test.ts`, `tests/pantallas/mostrador.test.tsx`, `tests/pantallas/produccion-entrega.test.tsx`, `e2e/flujo-completo.spec.ts` |
| **Anular pago** (con PIN de gerente si lo hace un cajero) | Probado en LOCAL · 🔴 no en producción | `tests/pantallas/ordenes.test.tsx` (PIN malo avisa, PIN bueno autoriza) |
| **Pago repetido / id de otra tienda** | Probado en LOCAL | `tests/integracion/dinero-bordes.test.ts` (comprobado en rojo) |
| **Caja**: apertura, entradas, salidas, cajón sin venta, cierre a ciegas con diferencia | Probado en LOCAL · 🔴 no en producción | `tests/pantallas/caja.test.tsx` (faltan $2.00), `e2e/flujo-completo.spec.ts` (cierre con $117.50) |
| **Reportes** de lo cobrado por día y por forma de pago | Probado en LOCAL · 🔴 no en producción | `tests/integracion/reportes.test.ts`, `e2e/pantallas.spec.ts` |
| 🔴 **Stripe Terminal / Checkout / Connect** (cobrar tarjetas de verdad) | **NO CONSTRUIDO** | Fase 2. Espera que Richard elija procesador (PENDIENTES 👤) |
| 🔴 **Suscripción de las tintorerías** (Stripe Billing) | **NO CONSTRUIDO** | Fase 2. Espera precios de los planes (PENDIENTES 👤) |
| 🔴 **Webhooks de pago con firma** | **NO CONSTRUIDO** | Llega con Stripe |

## Cómo se prueba cuando se publique (orden obligatorio)

1. Publicar con base real y variables completas; `/datos/salud` en verde.
2. Crear una tintorería de prueba del equipo (nombre con «Soporte»).
3. Abrir caja con un fondo conocido.
4. Crear una orden cobrando un **abono en efectivo**; comprobar el vuelto.
5. Crear otra cobrando **todo con tarjeta** con referencia.
6. Entregar la primera cobrando el saldo en efectivo.
7. Anular un pago como cajero con el PIN de un gerente.
8. Apagar el wifi de la tablet, crear una orden y cobrar; volver a conectar y
   comprobar que aparece una sola vez.
9. Cerrar caja contando un monto distinto y comprobar la diferencia en
   «Cierres anteriores» con la cuenta del dueño.
10. Revisar Reportes: cobrado por día y por forma de pago iguales a lo hecho.
11. Anotar aquí la fecha y el resultado de cada punto. Hasta entonces, todo
    sigue en 🔴 «no probado en producción».
