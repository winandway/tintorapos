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
