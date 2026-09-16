# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **Modo de ejecución.** Recomendación: por fases, cada fase de corrido en
   modo autónomo y un punto de control entre fases (ver `ESTUDIO-TINTORA-POS.md`,
   punto 12). Con tu «adelante» arranca la Fase 0 (repo + blindaje).
   **Destranca:** todo lo demás.
2. 👤 **Crear el repositorio público en GitHub** con el nombre `tintora-pos`
   (recurso nuevo: necesita tu sí; lo creo yo con tu OK).
   **Destranca:** la publicación automática en YaDominios Cloud.
3. 👤 **Plan de pago del sitio en YaDominios Cloud** para `tintora-pos`
   (la base de datos solo existe en plan de pago; el precio lo ves en el panel).
   **Destranca:** publicar la Fase 1 con base de datos real.
4. 👤 **Dominio propio.** Recomendación: `tintorapos.com` (el 16 sep 2026 no
   tenía DNS, señal de que está libre; se confirma al comprarlo). También
   están sin DNS `tintora.app` y `tintorapos.app`.
   **Destranca:** correo saliente con marca, avisos con enlace propio, marca.
5. 👤 **Precio de los planes** (Básico / Pro / Cadena) y si los SMS/WhatsApp
   van incluidos o se cobran al costo.
   **Destranca:** página de precios y suscripción con Stripe Billing (Fase 2).
   No bloquea la Fase 1.
6. 👤 **Procesador de pagos:** Stripe (recomendado) o Square.
   **Destranca:** cobro con tarjeta (Fase 2).
7. 👤 **Cron Trigger en tu cuenta de Cloudflare** para el reloj externo que
   llama a `/datos/reloj` (recurso nuevo: necesita tu sí; lo creo yo con tu OK).
   **Destranca:** avisos automáticos, recordatorios y respaldo diario (Fase 1).
8. 👤 **Registro A2P 10DLC en Twilio** para mandar SMS en EE.UU. (pide datos
   de la empresa; te paso link + croquis cuando toque).
   **Destranca:** avisos por SMS (Fase 1). Mientras tanto, correo.

## Fila de la IA (🤖), en orden

1. 🤖 **Fase 0 — Cimientos** (espera el 👤1): Next.js 16 último, blindaje de 6
   capas, esqueleto bilingüe, favicon y tarjeta social, pie con crédito,
   `/docs` con estructura, canario `/datos/salud`, `CANDADOS.md`,
   `VERIFICAR-PAGOS.md`, Action a `yapanel-build`.
2. 🤖 **Fase 1 — MVP vendible** (espera la Fase 0 y el 👤3 para publicar con
   base): mostrador, planta, entrega, clientes y avisos, caja, reportes,
   administración, guías en Docs.
3. 🤖 **Fase 2 — Tarjeta y crecimiento** (espera el 👤6): Stripe Terminal,
   portal con pago, Connect, Billing, multi-sucursal, WhatsApp, impresión directa.
4. 🤖 **Fase 3 — Lo que vende caro**: rutas, planes recurrentes, inventario,
   exportación contable, panel de cadena.

## Para la sesión de Laboratorio AI (no se hace aquí)

- Investigación de competencia con fuentes frescas (CleanCloud, SMRT, Enlite,
  SPOT, Cents, Compassmax, Geelus, Turns, Cleantie): precios, planes,
  funciones, quejas de usuarios. Documento
  `investigaciones/AAAA-MM-DD-tintora-pos-competencia.md`.
- Búsqueda de marca «Tintora» en USPTO antes de comprar el dominio.

## Hecho (✅)

- ✅ 2026-09-16 · Estudio y propuesta del proyecto: `ESTUDIO-TINTORA-POS.md`.
- ✅ 2026-09-16 · Búsqueda de código libre en GitHub: no hay base que valga la
  pena; se parte de cero (detalle en el estudio, punto 3.1).
- ✅ 2026-09-16 · Contrato de YaDominios Cloud copiado al repo
  (`docs/CONTRATO-YADOMINIOS.md`).
