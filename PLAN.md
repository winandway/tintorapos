# Plan: lanzar sin rojos + contabilidad de verdad + demo pública

> Piloto automático (19 sep 2026). Se ejecuta en orden, se marca aquí y se publica.
> Fuera de alcance por falta de credenciales: cobro con tarjeta (Stripe) y
> Turnstile. Los SMS quedan guardados para después: los avisos van por correo.

## Fase A — Quitar lo que frena el lanzamiento

- [x] A1. Reloj interno: los avisos, recordatorios y respaldos dejan de depender
      de un Cron externo (se disparan con el tráfico del sitio, con candado de
      una sola corrida a la vez). Canario en verde.
- [x] A2. Verificación de correo al registrarse: se envía, se comprueba, se
      reenvía, y el panel avisa mientras no esté verificado.
- [x] A3. Contacto de soporte sin buzón: página `/contacto`, mensajes guardados
      en la base y enviados por correo si hay `SUPPORT_EMAIL`.
- [x] A4. Privacidad y términos completos (los dos idiomas), con contacto real.
- [x] A5. Fin de la prueba gratis que de verdad bloquea + página de precios
      (importes los pone Richard).
- [x] A6. Demo pública con datos: cualquiera entra, prueba y toca todo; se
      limpia sola.

## Fase B — Contabilidad para tintorerías

- [ ] B1. Investigar en internet qué lleva la contabilidad de una tintorería y
      dejarlo escrito.
- [ ] B2. Base: proveedores, gastos, categorías, compras, insumos y movimientos.
- [ ] B3. Servidor y rutas `/datos/contabilidad/*`.
- [ ] B4. Pantallas: Gastos, Insumos y compras, Proveedores, Ganancia, Impuestos
      y Cuentas por cobrar, con su menú.
- [ ] B5. Exportación para el contador.
- [ ] B6. Candados y pruebas de todo lo anterior.

## Fase C — Publicar

- [ ] C1. `npm run verify`, punta a punta y paquete.
- [ ] C2. Publicar y comprobar en producción (registro, correo, demo, reloj).
- [ ] C3. Documentar en CANDADOS.md, PENDIENTES.md y las guías de Docs.
