# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **Conectar el repositorio en el panel de `tintorapos`:** repositorio
   `https://github.com/winandway/tintorapos` y rama `yapanel-build`, y tocar
   «Publicar sitio». La rama ya la deja lista la Action.
   **Destranca:** el sitio en vivo en `https://tintorapos.sitios.dev`.
2. 👤 **Pegar las variables de entorno** en el panel (tarjeta del sitio →
   Variables de entorno): `APP_SECRET`, `APP_URL`, `RELOJ_SECRETO`, `BACKUP_KEY`
   y `YADOMINIOS_TOKEN`. Los valores se entregan en el chat, nunca en el repo.
   **Destranca:** que la app arranque (sin `APP_SECRET` no abre).
3. 👤 **Cron Trigger en tu cuenta de Cloudflare** que llame cada 5 minutos a
   `https://tintorapos.sitios.dev/datos/reloj` con el secreto (recurso nuevo:
   lo creo yo con tu sí).
   **Destranca:** avisos automáticos, recordatorios y respaldo diario; el canario en verde.
4. 👤 **Confirmar la compra de `tintorapos.com`.** El panel lo muestra conectado,
   pero el 17 sep 2026 el registro .com respondía que no existe y no tenía DNS.
   Después: «Activar correos de mi dominio» en Mis dominios.
   **Destranca:** correos (recuperar contraseña, avisos por correo) y la dirección definitiva.
5. 👤 **Correo de soporte** para privacidad y términos (variable `SUPPORT_EMAIL`),
   y **revisión legal** de los dos borradores: qué empresa opera el servicio y el
   estado cuya ley aplica.
   **Destranca:** poder lanzar al público.
6. 👤 **Precio de los planes** (Básico / Pro / Cadena), si los SMS van incluidos
   y **qué pasa cuando termina la prueba gratis** (hoy solo muestra un aviso).
   **Destranca:** página de precios y suscripción (Fase 2).
7. 👤 **Procesador de pagos:** Stripe (recomendado) o Square.
   **Destranca:** cobrar con tarjeta dentro del sistema (Fase 2).
8. 👤 **Registro A2P 10DLC en Twilio** para SMS en EE.UU.
   **Destranca:** avisos por SMS reales.
9. 👤 **Claves de Turnstile** (escudo anti-robots de Cloudflare) para el sitio publicado.
   **Destranca:** protección de entrar, registrarse y recuperar contraseña.

## Fila de la IA (🤖), en orden

1. 🤖 **Comprobar la publicación** (espera 👤1 y 👤2): humo post-publicación
   (`node scripts/humo-publicado.mjs https://tintorapos.sitios.dev`), tablas creadas
   (consulta de solo lectura con el token), canario con detalle, variable
   `SITIO_URL` del repo para el humo automático, y la prueba de pagos en producción
   de `VERIFICAR-PAGOS.md` con una tintorería «Soporte».
2. 🤖 **Fase 2 — Tarjeta y crecimiento** (espera 👤6 y 👤7): Stripe Terminal,
   portal con pago, Connect, Billing, multi-sucursal, WhatsApp, impresión directa,
   firma del cliente al recoger.
3. 🤖 **Fase 3 — Lo que vende caro**: rutas de reparto, planes recurrentes,
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

