# Tintora POS — reglas del proyecto

> Se suman a las reglas globales de `~/.claude/CLAUDE.md`. Ante conflicto,
> manda la global.

## Qué es

Punto de venta y gestión en la nube para tintorerías y lavanderías, vendido
como suscripción (SaaS) a dueños de negocio en EE.UU. y Latinoamérica.
Bilingüe español/inglés. Marca: **Tintora POS**. Dueño: Richard (Windoce LLC).

**Estado (20 sep 2026):** en vivo en `https://tintorapos.com` (YaDominios Cloud),
bilingüe y con SEO. Además del POS: **demo público** sin registro que se borra solo a
las 24 horas, **verificación de correo**, **contacto**, **precios** (sin importes hasta
que Richard los ponga), **fin de la prueba gratis** que bloquea de verdad y
**contabilidad completa** (ganancia, gastos, compras, insumos, proveedores, por cobrar,
impuestos y archivo para el contador), **billetes de soporte** que se responden desde el
**panel de Windoce** (`/app/admin`: cuentas, uso, dinero y activar el plan de quien
paga). Precio: **120 USD al año por tienda**, un solo plan. **El reloj ya NO necesita
Cron externo**: lo mueve el tráfico del sitio. **No hay procesador de pagos**: el registro de cobros
(efectivo, tarjeta propia, otro, sin conexión, anular con PIN, caja y reportes) quedó
probado en producción el 17 sep 2026 (ver `VERIFICAR-PAGOS.md`).

## Documentos que mandan

| Archivo | Qué es |
| --- | --- |
| `ESTUDIO-TINTORA-POS.md` | Qué se construye, para quién, cómo se cobra, arquitectura y seguridad. Se lee antes de tocar cualquier cosa |
| `PENDIENTES.md` | La fila de trabajo (🤖) y lo que espera por Richard (👤). Se ejecuta en orden y se marca ahí |
| `docs/CONTRATO-YADOMINIOS.md` | Cómo se publica en YaDominios Cloud, sin depender de red |
| `CANDADOS.md` | Cada cosa que se rompió y cómo quedó fija. **Se lee antes de un rollback o de actualizar paquetes** |
| `VERIFICAR-PAGOS.md` | Estado real de cada pieza de dinero: probado con fecha o NO probado (en rojo) |
| `PLAN.md` | Los pasos del trabajo en curso, marcados a medida que se hacen |
| `docs/CONTABILIDAD-TINTORERIA.md` | Qué lleva la contabilidad del oficio y por qué el menú es el que es |
| `README.md` | Cómo se corre, se prueba y se publica |

## Perímetro (lista cerrada; lo que no está aquí no existe para la IA)

- **Carpeta de trabajo:** `/Users/windocellc/Software-Tintora POS` y nada más.
- **Publicación:** YaDominios Cloud, sitio `tintorapos` (`https://tintorapos.sitios.dev`),
  plan Galaxia, creado por Richard el 17 sep 2026. Se conecta a la rama
  `yapanel-build`. Token del sitio (base de datos y correo): lo tiene Richard y va
  en la variable `YADOMINIOS_TOKEN` del panel; **nunca** en el repo.
- **Dominio:** `tintorapos.com`, conectado al sitio en el panel. El 17 sep 2026 el
  registro .com respondía que NO existe y no tenía DNS: confirmar la compra.
- **Repositorio:** GitHub público `winandway/tintorapos` (cuenta `winandway` de Richard).
  Se trabaja en `main`; la Action `publicar` escribe `yapanel-build` solo si
  `verify` pasó en verde.
- **Correo saliente:** API de YaDominios (`src/server/correo.ts`), no la binding
  `env.EMAIL`. Guía: `https://yadominios.com/docs/correos-desde-tu-dominio`.
- **Cuenta de Cloudflare de Richard:** no se toca. El reloj externo ya no hace
  falta: `latirReloj()` lo mueve con el tráfico del sitio (`src/server/reloj/interno.ts`).
  `/datos/reloj` sigue existiendo por si algún día se quiere un reloj de afuera.
- **Correo de soporte y panel de Windoce:** `SUPPORT_EMAIL` y `CORREOS_ADMIN`
  (por defecto `go@windoce.com`, en `src/lib/soporte.ts`). Solo esos correos
  entran a `/app/admin`.
- **Servicios externos previstos:** Stripe, Twilio, WhatsApp Business (Meta).
  Ninguno conectado todavía; cada uno se conecta con autorización explícita.
- Nada de Supabase, Vercel, Netlify ni otras plataformas.

## Decisiones técnicas fijas

- Next.js **última 16.x**, TypeScript estricto, Tailwind, App Router.
- Compila con OpenNext a un solo `_worker.js` vía GitHub Action → rama
  `yapanel-build`. Antes de fijar versiones, leer el rango que exige
  `@opennextjs/cloudflare` para Next 16 (`node -p "require('./node_modules/@opennextjs/cloudflare/package.json').peerDependencies.next"`).
- Base de datos: `env.DB` (SQLite de la plataforma) con `schema.sql` en la raíz.
  **Una sola base, columna `tintoreria_id` en TODAS las tablas**, filtrada
  siempre desde la sesión del servidor. Ninguna ruta acepta `tintoreria_id`
  del cliente.
- Archivos (fotos, respaldos): `env.BUCKET`, servidos por `/media/...` con
  comprobación de sesión.
- **Rutas del backend con prefijo `/datos`. PROHIBIDO `/api/`.**
- Sin cron en la plataforma: **el reloj lo mueve el propio tráfico** (turno
  atómico en `sistema` + `waitUntil` desde el layout raíz). `/datos/reloj` con
  secreto sigue disponible para un reloj externo. Sin KV, sin colas, sin Durable
  Objects: la cola de avisos es una tabla.
- Contabilidad: **una compra a proveedor escribe TAMBIÉN su gasto**
  (`gastos.compra_id` único) y la ganancia se calcula SOLO de `gastos`. Toda
  tabla nueva con `tintoreria_id` se agrega a `TABLAS_RESPALDO`, a `TABLAS_DEMO`
  y al escenario de aislamiento, o las pruebas se ponen en rojo.
- Demo público: plan `demo`, no manda avisos, no se respalda y el reloj lo borra
  entero a las 24 horas.
- Dos pasos: el secreto se CONSERVA mientras no esté activo (si no, quien recarga
  la página queda fuera para siempre) y la ventana de activación es de ±2 min.
- Panel de Windoce: rutas `/datos/admin/*` con `exigirAdmin()`; cada consulta
  global lleva su marca `/* global: ... */`.
- Pagos: Stripe (Terminal, Checkout, Connect, Billing). Webhooks con firma
  verificada. Nunca se guarda una tarjeta.
- Idioma: bilingüe ES/EN con selector arriba; todo texto público en dos
  casillas en el panel.
- Docs en `/docs`, estilo Wikipedia, barra lateral que nunca se pierde.
- **SEO:** dominio canónico fijo `https://tintorapos.com` (`src/lib/sitio.ts`), no
  `APP_URL`. Cada página pública existe en `/es/…`, `/en/…` (direcciones en inglés:
  `/en/privacy`, `/en/terms`, `/en/signup`, slugs de guías en `src/lib/docs/slugs.ts`)
  y sin prefijo como x-default. Son rutas reales en `src/app/[idioma]/`; **PROHIBIDO
  `proxy.ts`/middleware** (mete `.wasm` y rompe el `_worker.js` único). Canónica y
  hreflang con `alternatesDe()` (`src/lib/seo.ts`); sitemap bilingüe con hreflang;
  datos estructurados JSON-LD; `tintorapos.sitios.dev` con `X-Robots-Tag: noindex`;
  IndexNow (`scripts/indexnow.mjs`, clave pública en `public/<clave>.txt`) después
  de cada publicación. Página pública nueva = agregarla a `RUTAS_INDEXABLES`.
- **Para agentes de IA:** las direcciones salen SIEMPRE de `src/lib/agentes/enlaces.ts`
  (cabecera `Link`, catálogo, manifiesto y pruebas). Hay servidor MCP público en
  `/mcp` (solo lectura: estado de una orden por su código, búsqueda en las guías y
  qué es el producto), `/.well-known/api-catalog`, `openapi.json`, `agent-skills`,
  `mcp/server-card.json`, `agent-card.json` y `ai-catalog.json`. Las páginas
  públicas responden Markdown con `Accept: text/markdown` (reescritura a `/md`).
  **PROHIBIDO publicar metadatos de OAuth mientras no exista el servidor OAuth.**
- Preferencias de tienda que no tienen columna: tabla `preferencias_tienda`
  (clave/valor). El esquema se aplica en cada publicación y NO admite `ALTER
  TABLE`.
- **Impresión:** recibo y etiquetas salen DIRECTO por la impresora conectada al
  equipo (WebUSB / Web Serial, `src/lib/impresion/`), sin la ventana del
  navegador, que queda de respaldo. Cada equipo guarda **dos puestos**: `recibos`
  (ESC/POS) y `etiquetas` (TSPL, ZPL, o ESC/POS por la misma de recibos). Todo
  botón de imprimir usa `BotonRecibo` (`tipo="recibo" | "interna" | "etiquetas"`)
  o `imprimirReciboDirecto` / `imprimirEtiquetasDirecto`. Al tocar
  `etiquetas.ts`: `node scripts/comprobar-zpl.mjs`. TSPL NO está probado en
  papel (CANDADOS B40).
- **Ningún formulario pierde lo escrito:** todos usan `useBorrador`
  (`src/lib/use-borrador.ts`). Guarda solo mientras se escribe, lo devuelve al
  volver con la línea `AvisoBorrador`, se borra al guardar y al cerrar sesión, y
  NUNCA guarda claves, PIN, códigos ni tarjetas. Formulario nuevo = con su
  borrador y su prueba.
- **Idioma:** el español va con la bandera de España y el inglés con la de
  EE.UU. Nunca la de México ni la de ningún otro país.
- Pie: `© <año> <dominio> | All rights reserved. Developed by Windoce LLC`.

## Cómo se trabaja (comandos)

- Local: `npm run db:local` (aplica `schema.sql` a la base local y a la de
  pruebas) y `npm run dev`. Variables en `.dev.vars` (copiar de `.dev.vars.example`).
- Antes de cada push: `npm run verify` (lo corre el hook `pre-push`).
- Punta a punta: `npm run test:e2e` (levanta su propio servidor en el puerto
  3210 con base aparte; Next no deja correr dos `next dev` a la vez en la misma
  carpeta: detener la vista previa antes).
- Paquete que se publica: `npm run cf:bundle && npm run test:paquete`.
- Pruebas de pantallas: `tests/pantallas/` (contra rutas y base reales, entorno
  Node + DOM de `tests/setup/dom-nodo.ts`; no pasarlas a `jsdom`).
- Textos: siempre en `src/lib/i18n/diccionarios/es` y `en`; sección nueva con
  `node scripts/i18n-seccion.mjs <nombre>`.

## Cómo se reporta

- Cada respuesta termina con «Esperando por ti» leído de `PENDIENTES.md`.
- Al terminar un trabajo visible: verificación en el navegador con captura,
  reporte corto y mensaje para el cliente (dueño de tintorería) en un bloque.

## Next.js 16

@AGENTS.md
