# Tintora POS

Punto de venta en la nube para tintorerías y lavanderías de EE.UU. y
Latinoamérica, en español e inglés. Mostrador, etiquetas con QR por prenda,
producción con escáner, entrega y cobro, caja con cierre a ciegas, avisos por
SMS, reportes, respaldos cifrados y modo sin conexión.

> Qué se construye y por qué: `ESTUDIO-TINTORA-POS.md`. Lo que falta y quién lo
> hace: `PENDIENTES.md`. Lo que no se puede romper: `CANDADOS.md`. Estado del
> dinero: `VERIFICAR-PAGOS.md`.

## Tecnología

- Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind 4.
- Corre como un solo `_worker.js` (OpenNext) en **YaDominios Cloud**, con su base
  SQLite (`env.DB`), su almacén de archivos (`env.BUCKET`) y `schema.sql` en la raíz.
- Rutas del backend en `/datos/*` y archivos en `/media/*` (nunca `/api/*`).

## Arrancar en la computadora

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm install
```

```bash
cd "/Users/windocellc/Software-Tintora POS" && cp .dev.vars.example .dev.vars
```

Llena `APP_SECRET` en `.dev.vars` (con `openssl rand -base64 48`). El archivo
está en `.gitignore`: nunca se sube.

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run db:local
```

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run dev
```

Abre `http://localhost:3000`, crea una cuenta en «Probar gratis» y sigue los
primeros pasos de la pantalla de inicio.

Para mirar las pantallas de adentro sin registrarte cada vez (útil al diseñar),
hay una tintorería de trabajo con catálogo, precios y clientes:

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run demo:local
```

Imprime dos cookies (`tp_sesion` y `tp_csrf`) para pegar en el navegador. Escribe
SOLO en la base local: nunca toca la base publicada.

## Pruebas

| Comando | Qué hace |
| --- | --- |
| `npm run verify` | Todo junto: tipos, lint, pruebas con cobertura, build, audit y secretos. Lo corre el hook antes de cada push |
| `npm test` | Pruebas de servidor, de interfaz y de pantallas contra la base real, con cobertura (umbral 60 % global y 90 % en dinero, sesiones, permisos y datos personales) |
| `npm run test:e2e` | Playwright de punta a punta en celular y escritorio (levanta su propio servidor en el puerto 3210) |
| `npm run cf:bundle` | Compila y arma `out-deploy/` con el `_worker.js` (corta si pasa de 10 MB en gzip) |
| `npm run test:paquete` | Levanta ese `_worker.js` con wrangler y le corre todas las pruebas de punta a punta |

## Capturas de la página de venta

```bash
cd "/Users/windocellc/Software-Tintora POS" && npm run demo:local && node scripts/capturas.mjs http://localhost:3000 <tp_sesion>
```

Salen en 2x; se pasan a webp a la mitad (ver el encabezado de `scripts/capturas.mjs`)
y se describen en `src/lib/contenido/capturas.ts`.

Las etiquetas para impresoras Zebra se comprueban contra un emulador público (no
entra en `verify` porque le pega a un servicio de afuera):

```bash
cd "/Users/windocellc/Software-Tintora POS" && node scripts/comprobar-zpl.mjs
```

## Para agentes de IA

| Dirección | Qué es |
| --- | --- |
| `https://tintorapos.com/mcp` | Servidor MCP público (JSON-RPC 2.0, solo lectura) |
| `https://tintorapos.com/.well-known/mcp/server-card.json` | Tarjeta del servidor MCP |
| `https://tintorapos.com/.well-known/api-catalog` | Catálogo de API (RFC 9727) |
| `https://tintorapos.com/.well-known/openapi.json` | Especificación de la parte pública |
| `https://tintorapos.com/.well-known/agent-skills/index.json` | Habilidades publicadas |
| `https://tintorapos.com/.well-known/agent-card.json` | Tarjeta de agente (A2A) |
| `https://tintorapos.com/.well-known/ai-catalog.json` | Manifiesto de recursos (ARD) |
| Cualquier página pública con `Accept: text/markdown` | La misma página en Markdown |

## Estructura

```
src/app/            páginas (portada, acceso, /app, /docs, /t/<código>) y rutas /datos
src/components/     pantallas y piezas de interfaz
src/server/         lógica de negocio (solo servidor): sesiones, órdenes, pagos, caja…
src/lib/            utilidades compartidas: dinero, fechas, idiomas, sin conexión, Docs
schema.sql          esquema de la base (idempotente; la plataforma lo corre en cada publicación)
tests/              unit, integración, interfaz y pantallas
e2e/                Playwright
scripts/            empaquetado, pruebas del paquete, humo post-publicación
```

## Publicar

Se publica **solo** en YaDominios Cloud (guía en `docs/CONTRATO-YADOMINIOS.md`):
la Action `.github/workflows/publicar.yml` compila y empuja a la rama
`yapanel-build`, que es la que se conecta en el panel. Después de publicar:

```bash
cd "/Users/windocellc/Software-Tintora POS" && node scripts/humo-publicado.mjs https://tintorapos.sitios.dev
```

Variables en el panel: `APP_SECRET`, `APP_URL`, `RELOJ_SECRETO`, `BACKUP_KEY`
(obligatorias) y `SUPPORT_EMAIL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `EMAIL_FROM`. El canario
`/datos/salud` dice cuál falta.

---

© 2026 Windoce LLC. Todos los derechos reservados.
