# PENDIENTES — Tintora POS

Leyenda: 👤 = depende de Richard · 🤖 = lo hace la IA en fila, sin que se pida · ✅ = hecho.
La IA lee este archivo al empezar cada sesión, ejecuta la fila 🤖 en orden y
repite la lista 👤 al final de cada respuesta hasta que se resuelva.

## Esperando por Richard (👤)

1. 👤 **Correo de soporte**: variable `SUPPORT_EMAIL` en el panel de YaDominios
   Cloud (una dirección donde tú leas: los mensajes del formulario de contacto
   ya se guardan en la base, pero sin esa variable no te llegan al buzón).
   **Destranca:** que te enteres cuando alguien escriba desde la página.
2. 👤 **Prueba de registro real**: abre `https://tintorapos.com/registro`, crea
   una cuenta con un correo tuyo y dime si te llegó el correo de bienvenida y si
   el enlace de confirmación funcionó. Crear cuentas y escribir contraseñas es
   lo único que no hago yo.
   **Destranca:** poder decir «el registro está probado en vivo» sin adivinar.
3. 👤 **Precio de los planes** (la página `/precios` ya está en vivo y dice
   «escríbenos» en vez de un número inventado), si los SMS van incluidos y **qué
   pasa cuando termina la prueba gratis** (hoy: se puede mirar y exportar todo,
   pero no seguir trabajando).
   **Destranca:** poner los importes y cobrar.
4. 👤 **Revisión legal** de privacidad y términos (los dos están completos y en
   vivo, en español e inglés, con la empresa y los encargados nombrados).
   **Destranca:** tranquilidad al lanzar al público.
5. 👤 **Stripe: dar el «sí» para conectarlo** (Richard ya tiene cuentas de Stripe).
   Hace falta decidir qué se cobra primero: la suscripción de las tintorerías
   (Billing) o el cobro con tarjeta en el mostrador (Terminal/Checkout).
   **Destranca:** Fase 2. PROHIBIDO anunciar cobros con tarjeta antes de probarlo.
6. 👤 **Registro A2P 10DLC en Twilio** para SMS en EE.UU. **Va al final**: primero
   los avisos por correo, y los SMS cuando todo lo demás esté funcionando.
   **Destranca:** avisos por SMS reales.
7. 👤 **Registros DNS para agentes (DNS-AID)** en el panel de YaDominios →
   Mis dominios → `tintorapos.com` → DNS: un TXT `_catalog._agents` con
   `url=https://tintorapos.com/.well-known/ai-catalog.json` y, si el panel ofrece
   el tipo SVCB/HTTPS, `_index._agents`.
   **Destranca:** la última casilla de descubrimiento por DNS del informe de agentes.
8. 👤 **Claves de Turnstile** (escudo anti-robots de Cloudflare).
   **Destranca:** protección de entrar, registrarse y recuperar contraseña.

## Fila de la IA (🤖), en orden

1. 🤖 **Fase 2 — Tarjeta y crecimiento** (espera 👤3 y 👤5): Stripe Terminal,
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
