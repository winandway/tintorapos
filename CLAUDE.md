# Tintora POS — reglas del proyecto

> Se suman a las reglas globales de `~/.claude/CLAUDE.md`. Ante conflicto,
> manda la global.

## Qué es

Punto de venta y gestión en la nube para tintorerías y lavanderías, vendido
como suscripción (SaaS) a dueños de negocio en EE.UU. y Latinoamérica.
Bilingüe español/inglés. Marca: **Tintora POS**. Dueño: Richard (Windoce LLC).

**Estado (16 sep 2026):** propuesta escrita, sin código. Se arranca por fases
cuando Richard dé el «adelante» (ver `PENDIENTES.md`).

## Documentos que mandan

| Archivo | Qué es |
| --- | --- |
| `ESTUDIO-TINTORA-POS.md` | Qué se construye, para quién, cómo se cobra, arquitectura y seguridad. Se lee antes de tocar cualquier cosa |
| `PENDIENTES.md` | La fila de trabajo (🤖) y lo que espera por Richard (👤). Se ejecuta en orden y se marca ahí |
| `docs/CONTRATO-YADOMINIOS.md` | Cómo se publica en YaDominios Cloud, sin depender de red |
| `CANDADOS.md` | Cada cosa que se rompió y cómo quedó fija (se crea en la Fase 0) |
| `VERIFICAR-PAGOS.md` | Estado real de cada método de pago: probado con fecha o NO probado (se crea en la Fase 0) |

## Perímetro (lista cerrada; lo que no está aquí no existe para la IA)

- **Carpeta de trabajo:** `/Users/windocellc/Software-Tintora POS` y nada más.
- **Publicación:** YaDominios Cloud, sitio `tintora-pos` (`tintora-pos.sitios.dev`).
  **Todavía no creado.** Se crea con el OK de Richard.
- **Repositorio:** GitHub público `tintora-pos`. **Todavía no creado.** Se crea
  con el OK de Richard.
- **Cuenta de Cloudflare de Richard:** solo para UN Cron Trigger (el reloj
  externo que llama a `/datos/reloj`). **Todavía no creado.** Nada más se toca
  en esa cuenta.
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
- Sin cron en la plataforma: el reloj es externo y llama a `/datos/reloj` con
  un secreto del panel. Sin KV, sin colas, sin Durable Objects: la cola de
  avisos es una tabla.
- Pagos: Stripe (Terminal, Checkout, Connect, Billing). Webhooks con firma
  verificada. Nunca se guarda una tarjeta.
- Idioma: bilingüe ES/EN con selector arriba; todo texto público en dos
  casillas en el panel.
- Docs en `/docs`, estilo Wikipedia, barra lateral que nunca se pierde.
- Pie: `© <año> <dominio> | All rights reserved. Developed by Windoce LLC`.

## Cómo se reporta

- Cada respuesta termina con «Esperando por ti» leído de `PENDIENTES.md`.
- Al terminar un trabajo visible: verificación en el navegador con captura,
  reporte corto y mensaje para el cliente (dueño de tintorería) en un bloque.

## Next.js 16

@AGENTS.md
