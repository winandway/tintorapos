# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **La clave secreta de Stripe** para cobrar los 120 USD al año dentro del
   sistema (`STRIPE_SECRET_KEY`, y la de webhook `STRIPE_WEBHOOK_SECRET`).
   **Destranca:** que una tintorería pague sola desde la app y se le active el
   plan sin que tú toques nada. Hoy: cuando alguien pague por fuera, lo activas
   con un toque en el panel de Windoce.
2. 👤 **Prueba de registro real**: abre `https://tintorapos.com/registro`, crea
   tu cuenta con `go@windoce.com` y avísame si llegó el correo y si el segundo
   paso te dejó entrar. Crear cuentas y escribir contraseñas es lo único que no
   hago yo. **Destranca:** tu panel de Windoce (entra con ese correo) y poder
   decir «el registro está probado en vivo».
3. 👤 **Registros DNS para agentes (DNS-AID)**: hay que pegárselo a la sesión de
   YaDominios Cloud con el prompt que te pasé. **Destranca:** la última casilla
   de descubrimiento del informe de agentes.
4. 👤 **Claves de Turnstile** (escudo anti-robots de Cloudflare).
   **Destranca:** protección de entrar, registrarse y recuperar contraseña.
5. 👤 **El nombre de tu tienda quedó mal escrito.** Yo no puedo entrar a tu cuenta
   (no escribo contraseñas). Se corrige en **Ajustes → Tienda → Nombre de la
   tienda → Guardar cambios**: cambia al instante en el menú, el recibo, las
   etiquetas y los correos. **Destranca:** que tus clientes vean el nombre bien.
6. 👤 **Probar el recibo por correo en tu tienda:** crea una orden a un cliente
   con TU correo y mira si llega. Dentro de la orden, la línea «Recibo por
   correo» dice si salió o por qué no. **Destranca:** poder decir que el recibo
   digital está probado en vivo con un correo de verdad.
7. 👤 **Probar las etiquetas en papel.** Hoy, sin comprar nada: Ajustes →
   Impresoras → tarjeta «Impresora de etiquetas» → «En la misma impresora de
   recibos» → «Imprimir una etiqueta de prueba». Y cuando tengas una etiquetera
   (recomendada para Colombia: TSC TE200, de transferencia térmica), el mismo botón en
   «En una etiquetera conectada». **Destranca:** poder decir que la etiquetera
   directa está probada en papel (hoy solo lo está contra el manual; la de Zebra,
   contra un emulador).
8. 👤 **Registro A2P 10DLC en Twilio** para SMS en EE.UU. **Va al final**: los
   avisos van por correo. **Destranca:** avisos por SMS reales.

## Fila de la IA (🤖), en orden

1. 🤖 **Fase 2 — Tarjeta y crecimiento** (espera 👤1): Stripe Terminal,
   portal con pago, Connect, Billing, multi-sucursal, WhatsApp, impresión directa,
   firma del cliente al recoger.
2. 🤖 **Fase 3 — Lo que vende caro** (va después de la Fase 2: los planes
   recurrentes cobran con tarjeta): rutas de reparto, planes recurrentes,
   panel de cadena. (Inventario de insumos y exportación contable ya están
   hechos, en Contabilidad.)

## Para la sesión de Laboratorio AI (no se hace aquí)

- Investigación de competencia con fuentes frescas (CleanCloud, SMRT, Enlite,
  SPOT, Cents, Compassmax, Geelus, Turns, Cleantie): precios, planes,
  funciones, quejas de usuarios.
- Búsqueda de marca «Tintora» en USPTO antes de comprar el dominio.

## Hecho (✅)

- ✅ 2026-09-21 · **Recibo digital por correo**: sale solo al crear la orden, con
  las prendas, el total y el botón a la orden, a nombre de la tienda; se reenvía
  desde la orden y la orden dice si salió. **Cobro por kilo**: cada tienda elige
  kilos o libras (de fábrica, por país). Y quedó cerrado un hueco: una tabla que
  no entraba en los respaldos ni en la limpieza del demo.

- ✅ 2026-09-20 · **Dos impresoras por equipo y etiquetas de un toque**: la de
  recibos y la de etiquetas se conectan cada una en su tarjeta; las etiquetas
  salen directo en TSPL, ZPL o por la misma impresora de recibos, con su botón de
  prueba. Guía de Docs con qué etiquetera comprar y cómo probar sin tener una.

- ✅ 2026-09-20 · **El segundo paso ya no deja a nadie afuera** (bloqueaba a todo
  dueño nuevo), **precio de 120 USD al año** publicado, **billetes de soporte**
  con aviso a `go@windoce.com` y respuesta por correo, y **panel de Windoce**
  con las cifras del negocio y el botón para activar a quien pague.

- ✅ 2026-09-19 · **El reloj ya no depende de nadie**: lo mueve el tráfico del
  sitio con candado de una sola corrida cada 5 minutos, así que los avisos, los
  recordatorios y el respaldo diario funcionan sin el Cron externo. El canario
  de producción dice `reloj: ok` y `respaldos: ok`.
- ✅ 2026-09-19 · **Verificación de correo al registrarse**, página de contacto
  con los mensajes guardados, privacidad y términos completos en los dos
  idiomas, página de precios y fin de la prueba gratis que de verdad bloquea
  (se puede mirar y exportar; no seguir trabajando).
- ✅ 2026-09-19 · **Demo público en vivo**: cualquiera entra desde la portada sin
  registrarse y cae en su propia tintorería con un día de trabajo cargado; no le
  escribe a nadie y se borra sola a las 24 horas.
- ✅ 2026-09-19 · **Contabilidad completa** (investigada primero en internet,
  `docs/CONTABILIDAD-TINTORERIA.md`): ganancia, gastos por categoría del oficio,
  compras a proveedores, insumos con aviso de reorden, proveedores, cuentas por
  cobrar con antigüedad, impuestos y archivo para el contador. Con sus guías en
  Docs.

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
- ✅ 2026-09-17 · Mostrador nuevo: cada prenda con su dibujo, marcas de daños,
  manchas y color con un toque, y el estado de la prenda impreso en el recibo y
  en la etiqueta.
- ✅ 2026-09-17 · Conectar un celular escaneando un QR desde la tablet (enlace de
  un solo uso de 10 minutos, entra con PIN).
- ✅ 2026-09-17 · Sitio listo para agentes de IA: servidor MCP público (`/mcp`),
  catálogo de API con OpenAPI, tarjetas MCP y A2A, habilidades con huella,
  manifiesto ARD, Markdown por negociación, cabeceras Link y señales de contenido.
- ✅ 2026-09-18 · Correo saliente funcionando: el proveedor acepta `avisos@tintorapos.com`
  (prueba 16:31 UTC, 200 con `message_id`); canario del correo en verde y ahora
  basado en el último envío real (B22).
- ✅ 2026-09-18 · Correo del dominio activo (`avisos@tintorapos.com`, 300 al día).
  Falta ver uno llegar a una bandeja real con la recuperación de contraseña.
- ✅ 2026-09-18 · Richard envió el sitemap en Search Console y puso `APP_URL`.
- ✅ 2026-09-19 · Formulario de registro con TODOS los países y monedas del mundo,
  con buscador (faltaban Venezuela, Rumania y casi todo el mundo).
- ✅ 2026-09-19 · Capturas reales del sistema en la página de venta, con carrusel
  del flujo de una orden.
- ✅ 2026-09-19 · POS a pantalla completa con el menú en una hamburguesa, y la
  entrada del menú se llama POS.
- ✅ 2026-09-19 · Permisos por empleado con palomitas (tabla `permisos_usuario`),
  con el rol como punto de partida y sin poder repartir lo que uno no tiene.
