# CANDADOS — Tintora POS

> Cada cosa que se rompió (o que no puede romperse nunca), por qué, cómo quedó
> fija, en qué commit, cómo se comprueba y qué NO tocar. Escrito para que otra
> IA, en otra sesión y sin memoria, pueda repararlo sola.
>
> **Antes de un rollback, un revert o una actualización grande de paquetes, se
> lee este archivo y se corre `npm run verify` y `npm run cf:bundle && npm run test:paquete`.**
> Si una prueba de aquí se pone en rojo, el cambio no está terminado.

## Cómo se comprueban TODOS a la vez

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run verify
```

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run cf:bundle && npm run test:paquete
```

El primero corre tipos, lint, las pruebas con cobertura (umbral 60 % global y
90 % en dinero, sesiones, permisos, clientes, órdenes y respaldos), el build, el
audit y el escaneo de secretos. El segundo compila el `_worker.js` que se
publica y le corre las pruebas de punta a punta en celular y escritorio.

---

## A. Candados de diseño (no se rompieron: no pueden romperse)

### A1. Cada tintorería ve solo lo suyo (aislamiento)

- **Riesgo:** una consulta sin `tintoreria_id` le muestra a una tienda los
  clientes, órdenes o dinero de otra. Es el peor fallo posible de un SaaS.
- **Cómo está hecho:** una sola base; TODAS las tablas de negocio llevan
  `tintoreria_id`; el valor sale SIEMPRE de la sesión del servidor
  (`src/server/ruta.ts`), nunca del navegador.
- **Candados:**
  - `tests/unit/candado-sql.test.ts`: lee todo el SQL de `src/` y falla si una
    consulta de negocio no filtra por `tintoreria_id`. Las excepciones llevan un
    comentario marcador dentro del SQL: `/* sistema: … */`, `/* token secreto: … */`,
    `/* código público: … */` o `/* global: … */`.
  - `tests/integracion/aislamiento.test.ts`: descubre TODAS las rutas `/datos` y
    `/media`; el dueño de la tintorería B intenta leer, cambiar y borrar datos de
    A por cada una, con sesión nueva por caso, y compara una huella de los datos
    de A antes y después. Una ruta nueva sin su caso en
    `tests/ayuda/cobertura-rutas.ts` pone la prueba en rojo.
  - `tests/integracion/esquema.test.ts`: toda tabla de negocio tiene `tintoreria_id`.
- **Commit:** `6d009ba`.
- **NO tocar:** no quitar el marcador de una consulta para «que pase»; no
  aceptar `tintoreria_id` en el cuerpo de ninguna ruta.

### A2. Historial que no se borra (auditoría)

- **Cómo está hecho:** triggers de SQLite en `schema.sql` que impiden `update` y
  `delete` sobre `auditoria`.
- **Candado:** `tests/integracion/esquema.test.ts` («la auditoría no se puede
  editar ni borrar»).
- **NO tocar:** los triggers `auditoria_sin_editar` / `auditoria_sin_borrar`.

### A3. Dinero en centavos enteros y cobros idempotentes

- **Cómo está hecho:** `src/lib/dinero/index.ts` (centavos y puntos básicos,
  nunca decimales); `CHECK (pagado_cents <= total_cents)` en `ordenes`; cada pago
  lleva un `id` generado en el dispositivo y repetirlo devuelve «repetido».
- **Candados:** `tests/unit/dinero.test.ts`, `tests/integracion/ordenes-caja.test.ts`,
  `tests/integracion/dinero-bordes.test.ts`.
- **NO tocar:** no pasar montos a `number` con decimales; no quitar el `CHECK`.

### A4. Sesiones, contraseñas, PIN y dos pasos

- **Cómo está hecho:** sesiones en el servidor (hash SHA-256 de un token de
  256 bits), PBKDF2-SHA256 con 100 000 iteraciones (el máximo que permite el
  entorno de Workers; argon2 no corre ahí), TOTP con protección contra repetir
  el mismo código, PIN bloqueado 15 minutos tras 5 intentos, CSRF de doble
  cookie más comprobación de `Origin`.
- **Candados:** `tests/unit/auth-cripto.test.ts`, `tests/integracion/ruta.test.ts`,
  `tests/integracion/pin-limites.test.ts`, `tests/pantallas/acceso.test.tsx`.
- **NO tocar:** subir las iteraciones de PBKDF2 por encima de 100 000 rompe el
  login en producción (Workers lo rechaza); el formato del hash está versionado
  para poder migrar.

### A5. Idiomas completos

- **Candados:** `tests/unit/i18n.test.ts` (mismas claves en español e inglés),
  `tests/unit/contenido.test.ts` (portada, privacidad y términos con la misma
  forma y sin español olvidado en el inglés), `tests/ui/docs.test.tsx` (cada
  guía con la misma estructura en los dos idiomas y enlaces internos válidos).
- **NO tocar:** no agregar un texto solo en un idioma. Para una sección nueva:
  `node scripts/i18n-seccion.mjs <nombre>`.

### A6. Cabeceras de seguridad

- **Candado:** `tests/unit/cabeceras-seguridad.test.ts`. Comprobado también
  sobre el paquete compilado (CSP, HSTS, `X-Frame-Options: DENY`,
  `Referrer-Policy`).
- **NO tocar:** `src/lib/cabeceras-seguridad.ts` sin correr la prueba.

---

## B. Cosas que se rompieron y quedaron fijas

### B1. Rutas sin parámetros se caían en el navegador

- **Cómo se veía:** páginas de `/datos` respondían error 500 en el navegador
  real, aunque las pruebas pasaban.
- **Causa real:** Next 16 entrega `params` como promesa que puede resolver a
  `undefined` en rutas sin parámetros; el código hacía `Object.entries(undefined)`.
- **Arreglo:** `src/server/ruta.ts` usa `(extra?.params ? await extra.params : undefined) ?? {}`.
- **Commit:** `6d009ba`.
- **Candado:** `tests/integracion/ruta.test.ts` (caso con `params` que resuelve a `undefined`).

### B2. La prueba de aislamiento podía pasar sin probar nada

- **Cómo se veía:** un caso con un id vacío «pasaba» porque la ruta respondía
  404 por el id, no por el aislamiento. Además, un caso de «salir» dejaba sin
  sesión a los casos siguientes.
- **Arreglo:** sesión nueva por caso y guarda que falla si un parámetro va vacío.
- **Commit:** `6d009ba`.
- **Candado:** `tests/integracion/aislamiento.test.ts` («parámetro sin valor»).

### B3. Un pago con el id de un pago de otra tintorería

- **Cómo se veía:** la prueba de aislamiento lo detectó: la tintorería B
  mandaba un pago con el mismo `id` de un pago de A y el sistema lo daba por
  «repetido», contestando como si fuera suyo.
- **Causa real:** el choque de clave primaria se interpretaba siempre como pago repetido.
- **Arreglo:** `src/server/pagos/index.ts` solo llama «repetido» si el pago existe
  en ESTA tintorería; si no, responde 409 `conflicto`.
- **Commits:** `eef04ef` (arreglo), `6b85b86` (prueba directa).
- **Candado:** `tests/integracion/dinero-bordes.test.ts`, comprobado en rojo
  quitando la guarda.

### B4. El diálogo de impresión trababa la pestaña en pruebas

- **Cómo se veía:** al abrir `/app/ordenes/<id>/imprimir` en el navegador de
  pruebas, el diálogo de impresión automático congelaba la pestaña.
- **Arreglo:** `?vista=1` muestra sin imprimir, y `src/components/impresion/barra.tsx`
  no dispara la impresión automática si `navigator.webdriver` es verdadero.
- **Commit:** `7123fa2`.
- **Candado:** `e2e/flujo-completo.spec.ts` y `e2e/pantallas.spec.ts` abren
  recibo y etiquetas con `vista=1`.
- **NO tocar:** quitar la guarda de `webdriver` vuelve a trabar las pruebas.

### B5. `/datos/salud` delataba la configuración

- **Cómo se veía:** la respuesta pública decía qué variables faltaban y el texto
  de los errores del reloj y de la base.
- **Arreglo:** en público solo salen los estados (`ok` / `error` /
  `no_configurado`); el detalle pide `Authorization: Bearer RELOJ_SECRETO`.
  Los errores crudos van a `console.error`.
- **Commit:** `2242a89`.
- **Candado:** `tests/integracion/salud.test.ts`, comprobado en rojo.

### B6. Docs abría dos ventanas de búsqueda con ⌘K

- **Cómo se veía:** al elegir un resultado se navegaba, pero quedaba otra
  ventana abierta (la del menú de escritorio, oculta en el celular).
- **Causa real:** había dos buscadores montados (escritorio y celular) y los dos
  escuchaban ⌘K.
- **Arreglo:** una sola `VentanaBusqueda` en `src/components/docs/barra-docs.tsx`;
  los botones solo la abren con un evento.
- **Commit:** `fd82a71`.
- **Candado:** `tests/ui/docs.test.tsx`, comprobado en rojo montando dos ventanas.

### B7. 404 dentro de Docs con dos encabezados

- **Arreglo:** el cuerpo del 404 está en `src/components/sitio/no-encontrada.tsx`;
  `src/app/(docs)/docs/not-found.tsx` lo usa sin encabezado propio.
- **Commit:** `fd82a71`.

### B8. El encabezado se salía de la pantalla en celulares angostos

- **Cómo se veía:** a 330 px el botón «Ir al panel» quedaba cortado.
- **Arreglo:** `Logo compacto` oculta la palabra debajo de 360 px; en celular se
  muestra «Entrar» en vez de «Probar gratis».
- **Commit:** `fd82a71`.
- **Candado:** `e2e/pantallas.spec.ts` exige que ninguna pantalla sea más ancha
  que la ventana, en celular y escritorio.

### B9. La base de las pruebas de punta a punta se leía de otra carpeta

- **Cómo se veía:** «no such table: limites» al registrarse en las pruebas de Playwright.
- **Causa real:** `wrangler d1 execute --persist-to=X` guarda en `X/v3`, y
  `next dev` leía `X`.
- **Arreglo:** `next.config.ts` usa `` `${carpeta}/v3` ``.
- **Commit:** `eaec207`.
- **NO tocar:** la ruta `/v3`.

### B10. El escáner de producción le robaba el foco a la ubicación del rack

- **Cómo se veía:** en Producción, si un cambio terminaba de guardarse mientras
  la persona escribía la ubicación («B-12»), el texto caía en el campo del escáner.
- **Causa real:** `CampoEscaneo` enfocaba el escáner cada vez que dejaba de estar
  ocupado, sin mirar dónde estaba escribiendo la persona.
- **Arreglo:** `escribiendoEnOtroCampo()` en `src/components/ui/campo-escaneo.tsx`:
  no roba el foco a otro campo de texto (sí vuelve si el foco está en una casilla
  o un botón, porque el lector escribe donde esté el foco).
- **Commit:** `6b85b86`.
- **Candado:** `tests/ui/campo-escaneo.test.tsx`, comprobado en rojo.

### B11. Las ventanas no tenían nombre para lectores de pantalla

- **Arreglo:** `src/components/ui/modal.tsx` enlaza el título con `aria-labelledby`.
- **Commit:** `6b85b86`.
- **Candado:** las pruebas de `tests/pantallas/` buscan cada ventana por su nombre.

### B12. El correo usaba una forma que la plataforma no acepta

- **Cómo se habría visto:** ningún correo de recuperación ni aviso salía en
  producción, y el panel no mostraba nada porque la llamada ni llegaba.
- **Causa real:** el código usaba la binding `env.EMAIL` con formato de Workers.
  La guía oficial de YaDominios dice que el envío es por
  `POST https://yapanel.yadominios.com/api/hosting/correo/enviar` con el token del
  sitio, y que el formato de la binding de Workers «aquí no aplica».
- **Arreglo:** `src/server/correo.ts` llama a esa API con `sitio`, `token`,
  `from.address` del dominio conectado, `to[]`, `reply_to` en texto plano y `text`
  siempre. Solo reintenta lo pasajero (5xx o red); token malo, remitente ajeno,
  límite del día y rebote permanente no se reintentan.
- **Variables:** `YADOMINIOS_TOKEN`, `EMAIL_FROM` y opcional `YADOMINIOS_SITIO`
  (por defecto `tintorapos`).
- **Candado:** `tests/integracion/correo.test.ts`, comprobado en rojo usando
  `replyTo` (el error que la guía dice que ya le costó una hora a otra IA).
- **NO tocar:** los nombres de los campos del cuerpo.

### B13. La compilación usaba un esbuild de fuera del proyecto

- **Cómo se veía:** en la computadora `npm run cf:bundle` funcionaba; en GitHub la
  Action `publicar` fallaba con `Cannot find package 'esbuild'`.
- **Causa real:** `@opennextjs/cloudflare` importa `esbuild` sin declararlo como
  dependencia. En la computadora Node lo encontraba subiendo carpetas, en
  `/Users/windocellc/node_modules/esbuild` (fuera del proyecto).
- **Arreglo:** `esbuild` 0.27 (la que usa el adaptador) en `devDependencies`, y
  `scripts/empaquetar-worker.mjs` corta si `esbuild` o `wrangler` se resuelven
  fuera del `node_modules` del proyecto.
- **Cómo se comprueba:** la Action `publicar` en GitHub termina en verde y deja la
  rama `yapanel-build`.
- **NO tocar:** no quitar `esbuild` de `devDependencies` aunque «nadie lo importe».

### B14. El proxy de Next rompía el paquete de un solo archivo

- **Cómo se veía:** al agregar `src/proxy.ts` (para las direcciones `/es` y `/en`),
  `npm run cf:bundle` cortaba con «El empaquetado dejó módulos aparte (…resvg.wasm,
  …yoga.wasm)».
- **Causa real:** con cualquier `proxy`/middleware, OpenNext mete el motor de
  middleware de Next, que trae el generador de imágenes con dos `.wasm`. wrangler
  los deja como archivos aparte y YaDominios Cloud necesita UN solo `_worker.js`.
- **Arreglo:** sin proxy. Las páginas con idioma en la dirección son rutas reales:
  `src/app/[idioma]/page.tsx`, `[idioma]/docs/…` y `[idioma]/[pagina]` (privacidad,
  términos, registro, con direcciones en inglés). Reutilizan las mismas pantallas
  (`PaginaInicio`, `MarcoDocs`, `PortadaDocs`, `PaginaGuia`, `PaginaLegal`).
- **Commit:** el de «feat: SEO bilingüe…» (ver `git log`).
- **Cómo se comprueba:** `npm run cf:bundle` termina sin módulos aparte y
  `npm run test:paquete` pasa `e2e/seo.spec.ts`.
- **NO tocar:** no crear `src/proxy.ts` ni `middleware.ts`.

### B15. El sitemap y robots apuntaban a sitios.dev

- **Cómo se veía:** `https://tintorapos.com/sitemap.xml` listaba
  `https://tintorapos.sitios.dev/…`. Google Search Console rechaza un sitemap con
  direcciones de otro dominio.
- **Causa real:** la dirección pública salía de la variable `APP_URL`.
- **Arreglo:** `src/lib/sitio.ts` fija `URL_SITIO = "https://tintorapos.com"` para
  todo lo público (sitemap, robots, canónicas, hreflang, datos estructurados,
  llms.txt). `tintorapos.sitios.dev` responde con `X-Robots-Tag: noindex`
  (`next.config.ts`). `APP_URL` queda solo para los enlaces que manda la app.
- **Candado:** `tests/unit/seo.test.ts` (comprobado en rojo volviendo a sitios.dev)
  y `scripts/humo-publicado.mjs`, que revisa el sitemap publicado.

### B16. La prueba en producción tocaba botones antes de que la página respondiera

- **Cómo se veía:** `E2E_URL=https://tintorapos.com npx playwright test
  e2e/flujo-completo.spec.ts` se quedaba en «Empezar» de la verificación en dos
  pasos hasta agotar el tiempo. En local pasaba. En la consola salía la política de
  seguridad bloqueando `static.cloudflareinsights.com`.
- **Causa real (dos):** (1) en producción la página llega antes que su JavaScript;
  el clic caía en un botón todavía sin vida y se perdía. (2) La plataforma inyecta
  la medición anónima de visitas de Cloudflare y la cabecera CSP la bloqueaba.
- **Arreglo:** `hidratada(page)` en `e2e/ayuda.ts` espera a que React tome la página
  antes de tocar nada (se usa después de cada `goto`/recarga del flujo).
  `src/lib/cabeceras-seguridad.ts` permite `https://static.cloudflareinsights.com`
  (script) y `https://cloudflareinsights.com` (envío); la política de privacidad lo
  declara en español e inglés. `NOMBRES` usa nombres «Soporte …» cuando la prueba
  corre contra un sitio publicado.
- **Candado:** `tests/unit/cabeceras-seguridad.test.ts` (la medición permitida y
  nada más) y `e2e/seo.spec.ts` (cero errores de consola).
- **NO tocar:** no quitar `hidratada` del flujo; no abrir la CSP a otros dominios
  «para que no moleste».

### B17. La compuerta de secretos frenaba el push por claves de Next

- **Cómo se veía:** `git push` cortaba con «gitleaks: leaks found: 7», todas en
  `_worker.js` de la rama `yapanel-build` (`previewModeSigningKey`,
  `previewModeEncryptionKey`, `encryptionKey`). Aparece en cuanto se baja esa rama
  con `git fetch`, porque `gitleaks git` revisa todas las ramas.
- **Causa real:** Next.js genera esas claves en cada compilación y las deja dentro
  del paquete. Son de Draft Mode y del cifrado de Server Actions: la app no usa
  ninguna de las dos (no hay `"use server"` ni `draftMode`).
- **Arreglo:** `.gitleaks.toml` (formato `[[allowlists]]`) permite SOLO esas tres por
  nombre exacto (`regexTarget = "match"`). No se permite el archivo entero.
- **Cómo se comprobó en rojo:** un `_worker.js` de prueba con `stripeApiKey:"<40 hex>"`
  sigue dando «leaks found»; con solo `previewModeSigningKey` da «no leaks found».
- **NO tocar:** no permitir `_worker.js` por ruta (con `paths` gitleaks ignora el
  archivo completo aunque haya otra clave). Si algún día se usan Server Actions,
  fijar `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` y revisar este punto, porque la rama
  publicada es pública.

### B18. Conectar un celular con un QR (enlace de un solo uso)

- **Qué resuelve:** para que un empleado trabaje desde su celular había que
  entrar con la contraseña del dueño en ese teléfono. Ahora la tablet muestra un
  QR, el celular lo escanea con su cámara y queda registrado como dispositivo.
- **Cómo está hecho:** `POST /datos/dispositivos/enlace` (permiso
  `dispositivos.gestionar`, máximo 20 cada 10 minutos por tintorería) guarda el
  enlace **cifrado** (hash SHA-256) en `enlaces_dispositivo` con 10 minutos de
  vida. `GET /v/<token>` lo consume: primero marca `usado_en` y solo si ESE
  update cambió una fila registra el dispositivo, así dos teléfonos que abran el
  mismo enlace a la vez no registran dos. Responde 303 a `/app/pin` con la cookie
  del dispositivo; si no sirve, a `/entrar?vinculo=vencido` sin decir por qué.
  El código solo, sin PIN, no abre nada.
- **Candado:** `tests/integracion/dispositivos-pin.test.ts` («conectar un celular
  con el QR…»), comprobado en rojo quitando `and usado_en is null`: el enlace se
  volvía reusable y la prueba falló. Más el caso en `tests/ayuda/cobertura-rutas.ts`
  (aislamiento entre tintorerías) y `/v/` en `robots.ts`.
- **NO tocar:** no guardar el token en claro, no alargar los 10 minutos, no
  registrar el dispositivo antes de marcar el enlace como usado (el orden
  importa: al revés falla la clave foránea y se cuelan dos dispositivos).

### B19. El dibujo de una prenda salía en otra («vest» dentro de «vestido»)

- **Cómo se veía:** al poner dibujo a cada prenda del mostrador, «Vestido /
  Dress» aparecía con el ícono de suéter, porque la palabra inglesa `vest`
  (chaleco) está DENTRO de «vestido».
- **Arreglo:** `src/lib/mostrador/iconos.ts` compara palabras completas
  (admitiendo el plural), no pedazos de palabra.
- **Candado:** `tests/unit/iconos-prendas.test.ts`, comprobado en rojo (con la
  comparación por pedazos, «Vestido» daba `sueter`).
- **NO tocar:** no volver a `texto.includes(palabra)` para elegir el dibujo.

### B20. La cara del sitio para los agentes de IA

- **Qué resuelve:** un escáner de preparación para agentes (isitagentready.com) dio
  20/100: sin cabeceras Link, sin señales de contenido, sin catálogo de API, sin
  Markdown, sin MCP y sin habilidades. Un agente no encontraba nada.
- **Cómo está hecho (todo público y de SOLO LECTURA):**
  - `src/lib/agentes/enlaces.ts` es la ÚNICA fuente de las direcciones: de ahí
    salen la cabecera `Link` (`next.config.ts`), el catálogo, el manifiesto y las
    pruebas. Importa `../sitio` con ruta relativa **a propósito**: `next.config.ts`
    no resuelve el alias `@/`.
  - Rutas: `/.well-known/api-catalog` (RFC 9727), `/.well-known/openapi.json`,
    `/.well-known/agent-skills/index.json` + un `SKILL.md` por habilidad,
    `/.well-known/mcp/server-card.json`, `/.well-known/agent-card.json` (A2A),
    `/.well-known/ai-catalog.json` (ARD) y `/mcp` (servidor MCP, JSON-RPC 2.0).
  - Markdown por negociación: `next.config.ts` reescribe a `/md/...` cuando la
    petición trae `Accept: text/markdown`; el navegador sigue recibiendo HTML.
    El texto se arma de los MISMOS contenidos (`src/lib/agentes/markdown.ts`).
  - `robots.txt` se escribe a mano (`src/lib/agentes/robots.ts`) para poder llevar
    `Content-Signal: search=yes, ai-input=yes, ai-train=no` y `Agentmap`.
  - Las herramientas MCP viven en `src/server/agentes/herramientas.ts` y se
    publican igual por WebMCP en el navegador (`herramientas-agente.tsx`).
- **Lo que un agente NO puede hacer:** entrar a una cuenta, ver importes,
  teléfonos o datos de clientes. La única puerta pública es el código del recibo,
  que ya era público, con límite de 60 consultas cada 10 minutos por IP.
- **Candados:** `tests/unit/agentes.test.ts` (cabecera Link, señales, huellas de
  las habilidades, Markdown de todas las guías), `tests/integracion/publico.test.ts`
  (MCP de punta a punta y que no se escape dinero ni teléfono),
  `tests/ayuda/cobertura-rutas.ts` (aislamiento) y el humo post-publicación, que
  comprueba en vivo el Markdown, la cabecera Link, las señales y `/mcp`.
- **Resultado medido:** el escáner de isitagentready.com pasó de **nivel 1
  «Basic Web Presence» (20/100)** a **nivel 5 «Agent-Native»** el 17 sep 2026,
  con 12 comprobaciones en verde. Se vuelve a medir con:
  `curl -s -X POST https://isitagentready.com/api/scan -H "content-type: application/json" -d '{"url":"https://tintorapos.com"}'`
- **A2A:** `/a2a` responde `message/send` de otro agente y elige la herramienta
  por el texto (`elegirHerramienta`). El código del recibo se busca como el token
  MÁS LARGO del mensaje: con la primera versión, «el código del recibo es …»
  tomaba la palabra «RECIBO» como código (la prueba lo fija).
- **NO tocar:** no publicar metadatos de OAuth (`openid-configuration`,
  `oauth-protected-resource`, `auth.md`) mientras no exista el servidor OAuth de
  verdad: anunciar una puerta que no existe rompe a los agentes que la usen.

### B21. La compuerta se ponía roja sola en GitHub

- **Cómo se veía:** `verify` fallaba en GitHub con pruebas que pasan en la
  computadora: «Attempted to use poisoned stub», «read ECONNRESET» o un texto que
  no aparece. Al repetir el trabajo, verde. Dos veces seguidas bloqueó una
  publicación buena.
- **Causa real:** las pruebas de integración y de pantallas levantan CADA archivo
  su propio miniflare (servidor real + base). En paralelo, sobre una máquina
  prestada y cargada, los objetos de un miniflare se envenenan al cerrarse otro.
- **Arreglo:** en `vitest.config.mts`, con `CI=1` los archivos corren de a uno
  (`fileParallelism: false`) y hay un reintento (`retry: 1`). En la computadora
  sigue en paralelo, que es más rápido.
- **Cómo se comprueba:** `CI=1 npx vitest run tests/pantallas --coverage=false`.
- **NO tocar:** no volver a poner las pruebas de pantallas en paralelo en CI para
  ganar minutos: el precio es una compuerta que miente.

### B22. El canario decía «correo ok» y el proveedor rechazaba todo

- **Cómo se veía:** el 17 sep 2026, con `EMAIL_FROM` ya puesto, `/datos/salud`
  marcaba `correo: ok`, pero la API respondía **502** `proveedor` con
  `email.sending.error.email.sender_not_configured`: el dominio no tenía activado
  «Correos desde tu dominio» (sin SPF ni DKIM en el DNS). La recuperación de
  contraseña ignoraba el resultado: nadie se habría enterado.
- **Causa real (dos):** (1) del lado de la plataforma, el dominio no estaba dado de
  alta en Email Sending aunque los registros de correo ya estaban en el DNS; lo
  arregló YaDominios el 18 sep 2026 a las 16:26 UTC (selector DKIM `cf-bounce`,
  return-path `cf-bounce.tintorapos.com`, DMARC `p=reject`). (2) De nuestro lado,
  el canario solo miraba las variables, y el envío trataba ese 502 como pasajero
  (lo reintentaba sin fin).
- **Arreglo:** `src/server/correo.ts` reconoce los errores de configuración
  (`sender_not_configured`, `token_*`, `from_ajeno`, `plan_sin_correo`), no los
  reintenta y anota el resultado de cada envío en `sistema.correo_ultimo` (sin
  destinatario ni contenido). `revisarSalud` pone el correo en rojo si el último
  envío falló por configuración, y en verde cuando vuelve a salir uno bien.
- **Cómo se prueba a mano sin mandarle nada a nadie:** un envío a una dirección de
  `example.com` (dominio reservado: nunca le llega a nadie). Con el dominio bien
  responde **200** `success: true` con la dirección en `en_cola` (cuenta 1 correo
  del día y el rebote aparece después en el panel); con el dominio sin dar de alta
  responde `502 … sender_not_configured`. Comprobado las dos caras: 17 sep 2026
  (502) y 18 sep 2026 16:31 UTC (200, `message_id` de @tintorapos.com).
- **Candados:** `tests/integracion/correo.test.ts` (la respuesta real del
  proveedor) y `tests/integracion/salud.test.ts` (comprobado en rojo apagando la
  regla). Las cuentas de prueba usan `@example.com`.
- **NO tocar:** no volver a decidir el estado del correo solo por las variables.

### B23. El formulario de registro solo tenía 18 países

- **Cómo se veía:** en «Probar gratis», el desplegable de país iba de Estados
  Unidos a España y **no estaban Venezuela, Rumania ni casi ningún otro país**.
  Un dueño de tintorería de esos países no podía ni registrarse. La moneda
  también era una lista corta y el servidor rechazaba cualquier otra
  (`z.enum(MONEDAS)` con 16).
- **Arreglo:** `src/lib/paises.ts` tiene los ~200 códigos ISO con su moneda; el
  NOMBRE lo pone el sistema en el idioma de la persona (`Intl.DisplayNames`), así
  no hay listas de nombres que mantener. Las monedas salen de
  `Intl.supportedValuesOf("currency")`. En el servidor, `esquemaMoneda` acepta
  cualquier ISO 4217 que el sistema sepa formatear y `esquemaPais` cualquier país
  de la lista. Los tres campos largos (país, moneda, zona horaria) usan
  `CampoBuscador`: se escribe y filtra, con banderita y la moneda al lado.
- **Candados:** `tests/unit/paises.test.ts` (más de 190 países, Venezuela y
  Rumania por nombre en los dos idiomas, VES y RON, y que `ZZ` no cuele).
- **NO tocar:** no volver a escribir listas de países a mano ni a fijar monedas
  con `z.enum`. Y `paisValido` NO se resuelve preguntándole a `Intl`: para `ZZ`
  responde «Región desconocida» y lo daría por bueno.

### B24. La página de venta no enseñaba el producto

- **Qué faltaba:** la landing contaba el sistema con texto y dibujos, pero no
  había una sola pantalla real; quien entraba no sabía cómo se ve por dentro.
- **Cómo está hecho:** `scripts/capturas.mjs` toma las capturas de la tintorería
  de trabajo LOCAL (`npm run demo:local`, que siembra un día de órdenes, pagos y
  caja abierta) con Playwright en 2x, y se pasan a webp a la mitad. Viven en
  `public/capturas/` y se describen una sola vez en
  `src/lib/contenido/capturas.ts` (texto alternativo y pie en los dos idiomas).
  El componente `Captura` les pone el marco (computadora, tablet, celular o
  papel) y `CarruselFlujo` enlaza cada paso de «Una orden, de principio a fin»
  con su pantalla.
- **NO tocar:** las capturas NUNCA salen de datos de un cliente real; se
  regeneran con el sembrado local. Si cambia una pantalla, se vuelven a tomar.

---

## C. Candados de publicación

### C1. El paquete que se publica es el que se prueba

- **Cómo está hecho:** `scripts/empaquetar-worker.mjs` comprueba el par de
  versiones Next ↔ `@opennextjs/cloudflare` (el rango tiene un hueco que se
  mueve), compila, empaqueta con `wrangler deploy --dry-run` en UN `_worker.js`
  y corta si pasa de 10 MB en gzip. `scripts/probar-paquete.mjs` lo levanta con
  wrangler y le corre las 30 pruebas de Playwright.
- **Resultado del 16 sep 2026:** 4.64 MB en gzip; 30 de 30 pruebas en verde;
  reloj (3 respaldos), cabeceras y canario comprobados sobre el paquete.
- **Commit:** `50943b9`.
- **NO tocar:** la base del paquete de prueba vive FUERA de su carpeta; adentro,
  wrangler se recarga sin parar.

### C2. Pruebas de pantallas contra el servidor real

- **Cómo está hecho:** `tests/ayuda/puente-ui.ts` manda el `fetch` de cada
  componente a las rutas `/datos` reales con la base local de pruebas.
  `tests/setup/dom-nodo.ts` arma el DOM sobre Node: el entorno `jsdom` de vitest
  cambia `Uint8Array`/`TextEncoder` y rompe el motor local de la base.
- **Commit:** `6b85b86`.
- **NO tocar:** no pasar `tests/pantallas` al entorno `jsdom`.
