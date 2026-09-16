# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **Crear el repositorio público en GitHub `tintora-pos`** (recurso nuevo:
   lo creo yo con tu sí). Ojo: YaDominios Cloud exige repositorio **público**, así
   que el código comercial queda a la vista. Los secretos nunca van al repo.
   **Destranca:** la publicación automática.
2. 👤 **Plan de pago del sitio `tintora-pos` en YaDominios Cloud** (la base de
   datos solo existe en plan de pago; el precio lo ves en el panel).
   **Destranca:** publicar con base de datos real.
3. 👤 **Cron Trigger en tu cuenta de Cloudflare** que llame cada 5 minutos a
   `/datos/reloj` con el secreto (recurso nuevo: lo creo yo con tu sí).
   **Destranca:** avisos automáticos, recordatorios y respaldo diario.
4. 👤 **Dominio propio.** Recomendación: `tintorapos.com` (se confirma al comprarlo).
   **Destranca:** correo saliente con marca (recuperar contraseña, avisos por correo).
5. 👤 **Correo de soporte** para publicar en privacidad y términos (variable
   `SUPPORT_EMAIL`), y **revisión legal** de esos dos borradores: qué empresa
   opera el servicio y el estado cuya ley aplica.
   **Destranca:** poder lanzar al público.
6. 👤 **Precio de los planes** (Básico / Pro / Cadena), si los SMS van incluidos
   o se cobran aparte, y **qué pasa cuando termina la prueba gratis** (hoy solo
   muestra un aviso y no bloquea nada).
   **Destranca:** página de precios y suscripción (Fase 2).
7. 👤 **Procesador de pagos:** Stripe (recomendado) o Square.
   **Destranca:** cobrar con tarjeta dentro del sistema (Fase 2).
8. 👤 **Registro A2P 10DLC en Twilio** para mandar SMS en EE.UU. (pide datos de
   la empresa; te paso link + croquis cuando toque).
   **Destranca:** avisos por SMS reales.
9. 👤 **Claves de Turnstile** (escudo anti-robots de Cloudflare) para el sitio
   publicado: te paso link + croquis al publicar.
   **Destranca:** protección de entrar, registrarse y recuperar contraseña.

## Fila de la IA (🤖), en orden

1. 🤖 **Publicar en YaDominios Cloud** (espera 👤1, 👤2 y 👤3): subir el repo,
   Action `publicar.yml` a la rama `yapanel-build`, generar `APP_SECRET`,
   `RELOJ_SECRETO` y `BACKUP_KEY` y ponerlos en el panel, humo post-publicación
   (`node scripts/humo-publicado.mjs https://…`), canario en verde, y la prueba de
   pagos en producción de `VERIFICAR-PAGOS.md`.
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
