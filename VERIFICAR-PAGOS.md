# VERIFICAR PAGOS — Tintora POS

> Estado REAL de cada pieza de dinero. Se consulta antes de afirmar nada sobre
> cobros y se actualiza en el mismo trabajo que toque cualquier pieza de pago.
> Regla global: prohibido decir «listo» o anunciar a un cliente algo de cobros
> que no se probó de punta a punta.

## 🔴 Resumen en rojo

- 🔴 **NO HAY PROCESADOR DE PAGOS INTEGRADO.** Tintora POS **no cobra tarjetas
  ni mueve dinero**. Solo **registra** los pagos que la tienda ya cobró (en
  efectivo, en su propia terminal de tarjeta o por otro medio).
- ✅ **Registrar cobros ya está probado en PRODUCCIÓN** (17 sep 2026, en
  `https://tintorapos.com` con la tintorería «Soporte Tintora POS (verificación)»):
  efectivo, tarjeta de la terminal propia, «otro», orden sin conexión, anular un
  pago con PIN del gerente, cierre de caja a ciegas y reportes por forma de pago.
  🔴 **Solo en local:** entradas y salidas de caja, cajón sin venta y cierre con
  diferencia.
- 🔴 **No hay suscripción ni cobro a las tintorerías** (Stripe Billing no existe
  todavía). La prueba gratis de 14 días solo muestra un aviso: no bloquea nada al
  terminar.
- **No se le anuncia a ningún cliente que «cobra con tarjeta».** La página
  principal y Docs dicen explícitamente que no procesa tarjetas.

## Estado por pieza

| Pieza | Estado | Cómo se probó (fecha) |
| --- | --- | --- |
| Registrar pago en **efectivo** (al crear la orden, abono o al entregar) | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, `E2E_URL=https://tintorapos.com npx playwright test e2e/flujo-completo.spec.ts --project=escritorio`: orden #1001 de $17.50, abono en efectivo $5.00 al recibir y $12.50 al entregar; en la base: dos pagos `efectivo` (500 y 1250), orden `entregada`. En local desde el 16 sep |
| Registrar pago con **tarjeta de la terminal propia** (referencia opcional) | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba: orden #1002, resto de $5.00 cobrado con tarjeta al entregar, referencia `4242`; en la base: pago `tarjeta_externa` 500 con referencia, orden `entregada` |
| Registrar pago **otro** (transferencia, app) | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba: abono de $2.50 con «Otro» desde el detalle de la orden #1002; en la base: pago `otro` 250 |
| **Pago sin conexión** (se sube al volver internet, sin duplicados) | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba: orden #1002 ($7.50) creada con el navegador sin internet; apareció una sola vez al volver la conexión |
| **Anular pago** (con PIN de gerente si lo hace un cajero) | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba: el cajero anuló el «otro» de $2.50 de la orden #1002 con el PIN del gerente; en la base: `anulado_por` = Soporte Cajero, `autorizado_por` = Soporte Gerente, motivo guardado. PIN malo: `tests/pantallas/ordenes.test.tsx` |
| **Pago repetido / id de otra tienda** | Probado en LOCAL | `tests/integracion/dinero-bordes.test.ts` (comprobado en rojo) |
| **Caja**: apertura y cierre a ciegas | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba: fondo $100.00, contado $117.50; en la base: esperado 11750, diferencia 0, turno `cerrado`. Entradas, salidas, cajón sin venta y cierre con diferencia: solo en LOCAL (`tests/pantallas/caja.test.tsx`, faltan $2.00) |
| **Reportes** de lo cobrado por día y por forma de pago | ✅ **PROBADO EN PRODUCCIÓN** | 17 sep 2026, misma prueba, entrando como gerente: cobrado $25.00 sin el pago anulado; efectivo $17.50, tarjeta $5.00, otro $2.50 |
| 🔴 **Stripe Terminal / Checkout / Connect** (cobrar tarjetas de verdad) | **NO CONSTRUIDO** | Fase 2. Espera que Richard elija procesador (PENDIENTES 👤) |
| 🔴 **Suscripción de las tintorerías** (Stripe Billing) | **NO CONSTRUIDO** | Fase 2. Espera precios de los planes (PENDIENTES 👤) |
| 🔴 **Webhooks de pago con firma** | **NO CONSTRUIDO** | Llega con Stripe |

## Cómo se repite la prueba en producción

```bash
cd "/Users/windocellc/Software-Tintora POS" && E2E_URL=https://tintorapos.com npx playwright test e2e/flujo-completo.spec.ts --project=escritorio
```

Crea una tintorería «Soporte Tintora POS (verificación)» nueva (con «Soporte Cajero»
y «Soporte Gerente») y hace el día completo. Después se mira en la base (solo lectura, con el token del sitio) la
tabla `pagos` y `turnos_caja` de esa tintorería.

## Lista completa para dar por probado todo el dinero

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
