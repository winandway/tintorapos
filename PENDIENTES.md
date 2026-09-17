# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **Enviar el sitemap en Google Search Console** (propiedad `tintorapos.com` →
   Sitemaps): `https://tintorapos.com/sitemap.xml`.
   **Destranca:** que Google descubra las 63 direcciones en español, inglés y x-default.
2. 👤 **Cambiar la variable `APP_URL`** del sitio a `https://tintorapos.com`.
   **Destranca:** que los enlaces de los SMS y correos usen el dominio propio.
3. 👤 **Cron Trigger en tu cuenta de Cloudflare** que llame cada 5 minutos a
   `https://tintorapos.com/datos/reloj` con el secreto (lo creo yo con tu sí).
   **Destranca:** avisos automáticos, recordatorios, respaldo diario y el canario en verde.
4. 👤 **«Activar correos de mi dominio»** en Mis dominios → `tintorapos.com`, y
   variable `EMAIL_FROM`.
   **Destranca:** correos de recuperación de contraseña y avisos por correo.
5. 👤 **Correo de soporte** para privacidad y términos (variable `SUPPORT_EMAIL`),
   y **revisión legal** de los dos borradores.
   **Destranca:** poder lanzar al público.
6. 👤 **Precio de los planes**, si los SMS van incluidos y **qué pasa cuando termina
   la prueba gratis**.
   **Destranca:** página de precios y suscripción (Fase 2).
7. 👤 **Procesador de pagos:** Stripe (recomendado) o Square.
   **Destranca:** cobrar con tarjeta dentro del sistema (Fase 2).
8. 👤 **Registro A2P 10DLC en Twilio** para SMS en EE.UU.
   **Destranca:** avisos por SMS reales.
9. 👤 **Claves de Turnstile** (escudo anti-robots de Cloudflare).
   **Destranca:** protección de entrar, registrarse y recuperar contraseña.

## Fila de la IA (🤖), en orden

1. 🤖 **Fase 2 — Tarjeta y crecimiento** (espera 👤6 y 👤7): Stripe Terminal,
   portal con pago, Connect, Billing, multi-sucursal, WhatsApp, impresión directa,
   firma del cliente al recoger.
2. 🤖 **Fase 3 — Lo que vende caro** (va después de la Fase 2: los planes recurrentes cobran con tarjeta): rutas de reparto, planes recurrentes,
   inventario, exportación contable, panel de cadena.

## Para la sesión de Laboratorio AI (no se hace aquí)

- Investigación de competencia con fuentes frescas (CleanCloud, SMRT, Enlite,
  SPOT, Cents, Compassmax, Geelus, Turns, Cleantie): precios, planes,
  funciones, quejas de usuarios.
- Búsqueda de marca «Tintora» en USPTO antes de comprar el dominio.

## Hecho (✅)

- ✅ 2026-09-16 · Estudio y propuesta del proyecto: `ESTUDIO-TINTORA-POS.md`.
- ✅ 2026-09-16 · Búsqueda de código libre en GitHub: se parte de cero (estudio, punto 3.1).
- ✅ 2026-09-16 · Contrato de YaDominios Cloud en el repo (`docs/CONTRATO-YADOMINIOS.md`).
- ✅ 2026-09-16 · Modo de ejecución: Richard pidió piloto automático para la Fase 0 y la Fase 1.
- ✅ 2026-09-16 · **Fase 0 — Cimientos y blindaje** (pasos 1–10 de `PLAN.md`).
- ✅ 2026-09-16 · **Fase 1 — MVP vendible**, construida y probada en local
  (pasos 11–52 de `PLAN.md`): 215 pruebas con 80 % de cobertura, 30 de punta a
  punta en celular y escritorio, paquete compilado probado. Documentado en
  `CANDADOS.md`, `VERIFICAR-PAGOS.md` y el punto 14 del estudio.
- ✅ 2026-09-17 · Richard creó el sitio `tintorapos` en YaDominios Cloud (plan Galaxia)
  y pasó el token del sitio. Repositorio público `winandway/tintorapos` creado y
  subido; la Action deja la rama `yapanel-build`.
- ✅ 2026-09-17 · Correo saliente cambiado a la API de YaDominios
  («Correos desde tu dominio»), con su prueba de formato comprobada en rojo.
- ✅ 2026-09-17 · Richard conectó el repositorio, pegó las variables y conectó
  `tintorapos.com`: sitio en vivo. Dominio verificado en Google Search Console.
- ✅ 2026-09-17 · SEO bilingüe: dominio canónico, direcciones `/es` y `/en` con
  hreflang, sitemap bilingüe, datos estructurados, `noindex` en sitios.dev e IndexNow.
- ✅ 2026-09-17 · Publicación comprobada: humo en vivo, 23 tablas en la base, humo e
  IndexNow automáticos después de cada publicación.
- ✅ 2026-09-17 · **Registro de cobros probado en producción** con la tintorería
  «Soporte Tintora POS (verificación)»: efectivo, tarjeta propia, otro, orden sin
  conexión, anular con PIN del gerente, cierre de caja a ciegas y reportes
  (`VERIFICAR-PAGOS.md`).
