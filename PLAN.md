# Plan: Tintora POS — Fase 0 (cimientos + blindaje) y Fase 1 (MVP vendible)

Modo: piloto automático (pedido por Richard el 16 sep 2026). Las dudas van al
«Bloque de preguntas» del final, no se pregunta nada en el camino.
Todo es LOCAL: no se crea repositorio en GitHub, ni sitio, ni recursos en la
nube (necesitan el sí de Richard, van en el bloque de preguntas).

## Fase 0 — Cimientos y blindaje

- [x] 1. Scaffolding: Next.js 16.3.5 (dentro del rango de @opennextjs/cloudflare), React 19, TypeScript estricto, Tailwind 4, App Router en `src/`
- [x] 2. Adaptador OpenNext + `wrangler.jsonc` local (DB, BUCKET, assets) + `yadominios.json` + `.dev.vars.example`; `next dev` con las bindings locales funcionando
- [x] 3. Blindaje capa 1: tsconfig estricto (`noUncheckedIndexedAccess`, `noImplicitOverride`), ESLint 10 + next + security + prettier, scripts `typecheck`/`lint`/`format`
- [x] 4. Blindaje capa 2: Vitest + coverage v8 con umbrales (60% global, 90% dinero/sesiones/permisos/datos personales), jsdom, Testing Library, MSW, arnés de D1 y R2 reales con Miniflare
- [x] 5. Blindaje capa 2b: Playwright configurado (celular y escritorio) + prueba de humo de rutas principales
- [x] 6. Blindaje capa 3: `.gitignore`, `.env.example`, gitleaks (config), Dependabot, `npm audit` en verify
- [x] 7. Blindaje capa 4: `src/env.ts` con zod (validación al arrancar + script `check:env`), cabeceras de seguridad (CSP, HSTS, XFO, nosniff, Referrer, Permissions)
- [x] 8. Blindaje capa 5: husky + lint-staged (pre-commit: formato, lint, gitleaks, pruebas relacionadas; pre-push: verify), `npm run verify`, GitHub Actions `verify.yml`
- [x] 9. Blindaje capa 6: Action `publicar.yml` (compila, comprueba par de versiones, empaqueta `_worker.js` + `schema.sql` a rama `yapanel-build`) y script de humo post-publicación
- [x] 10. Commit del blindaje solo, aparte, con `npm run verify` en verde

## Fase 1 — Base del producto

- [x] 11. Marca: logo SVG, paleta, tipografía, `icon.png`/`apple-icon.png` (sin favicon de Next), imagen Open Graph 1200×630, metadatos sociales
- [x] 12. i18n ES/EN: diccionarios tipados, idioma por cookie/navegador, selector con banderas arriba, prueba de paridad de claves
- [x] 13. `schema.sql` completo e idempotente (tintorerías, sucursales, usuarios, dispositivos, sesiones, clientes, catálogo, precios, órdenes, prendas, estados, pagos, turnos, movimientos, avisos, auditoría con triggers de solo-agregar, límites, respaldos, sync, sistema) + `db:local` para aplicarlo
- [x] 14. Capa de acceso a datos: `getEnv()`, cliente D1 tipado, utilidades de dinero (centavos, impuestos, redondeo), fechas por zona horaria, generadores de códigos seguros; pruebas al 90%+
- [x] 15. Envoltura de rutas `/datos`: sesión desde cookie, CSRF (origen + doble token), zod, límite de intentos en base, errores bilingües, contexto de auditoría
- [x] 16. Candado de aislamiento: prueba estática (todo SQL de tablas de inquilino filtra `tintoreria_id`) + prueba de cruce entre dos tintorerías por cada ruta + meta-prueba que falla si una ruta nueva no está cubierta

## Fase 1 — Cuentas y seguridad

- [x] 17. Contraseñas PBKDF2-SHA256 (100k, el máximo de Workers; sal por usuario; formato versionado para subir parámetros) y hash de PIN; secreto de dos pasos cifrado con AES-GCM; pruebas
- [x] 18. Registro de tintorería (prueba 14 días, sucursal principal, dueño, catálogo estándar sin precios inventados, regla «Soporte» para @windoce.com) con Turnstile opcional
- [x] 19. Entrar / salir: sesiones del servidor (cookie httpOnly, caducidad, cierre real + recarga completa), límite de intentos por correo e IP, Turnstile en servidor antes de mirar la clave
- [x] 20. Verificación en dos pasos (TOTP) obligatoria para el dueño: alta con QR, códigos de respaldo, verificación al entrar; pruebas con vectores RFC 6238
- [x] 21. Recuperar contraseña por correo (token de un solo uso, 1 h) con adaptador de correo `env.EMAIL` que falla visible
- [x] 22. Dispositivos de la tienda: registrar esta tablet, pantalla de PIN con empleados, bloqueo tras 5 intentos (15 min), bloqueo por inactividad, lista y revocación desde el panel
- [x] 23. Roles y permisos (dueño, gerente, cajero, planta, repartidor) + autorización con PIN de gerente + auditoría de solo-agregar; pruebas al 100% de la matriz
- [x] 24. Componentes base de la interfaz: `CampoClave` con ojito, botones, campos, modal, menú de 3 puntos (borrar solo ahí, con confirmación), avisos, encabezado con menú de cuenta y salir, pie con crédito Windoce LLC

## Fase 1 — Operación de la tienda

- [x] 25. Administración: datos de la tienda (dirección, teléfono, zona horaria, moneda, impuesto, recargo urgente, descuento máximo sin autorización, política de recogida), catálogo bilingüe de prendas y servicios, matriz de precios
- [x] 26. Empleados: alta con rol y PIN, correo y clave para gerentes, cambio de clave obligatorio al primer ingreso, desactivar dentro de los 3 puntos
- [x] 27. Clientes: buscar por teléfono o nombre, crear/editar, idioma, preferencias, consentimiento de SMS y correo con fecha, historial, borrado con papelera de 30 días (dentro de los 3 puntos)
- [x] 28. Órdenes (servidor): crear con prendas, precios, unidad pieza/libra, urgente, descuento con autorización, impuesto, fecha promesa, códigos QR por prenda; cambiar estados con historial; anular con autorización; pruebas de cálculo al 90%+
- [x] 29. Caja: abrir turno con fondo, pagos (efectivo, tarjeta en terminal propio, otro) con idempotencia, abonos, entradas/salidas y «abrir cajón» con autorización, cierre ciego con diferencia registrada; pruebas al 90%+
- [x] 30. Fotos de prendas: subida redimensionada en el navegador, guardado en `env.BUCKET`, servidas por `/media` con comprobación de sesión y pertenencia
- [x] 31. Mostrador (pantalla): nueva orden en pocos toques para tablet y celular, cliente, prendas, fotos, urgente, descuento, cobro o abono, confirmar e imprimir
- [x] 32. Impresión: recibo 80 mm para el cliente, copia interna, etiquetas con QR por prenda (2×1 in); reimpresión de recibo con autorización y auditoría
- [x] 33. Producción (pantalla): escanear QR (lector USB/Bluetooth y cámara), mover prenda/orden de estado, ubicación en el rack, lista por estado
- [x] 34. Entrega (pantalla): escanear ticket o buscar, ver saldo, cobrar lo pendiente, marcar entregada
- [x] 35. Lista y detalle de órdenes: filtros (estado, atrasadas, fecha), detalle con historial, pagos y acciones (anular dentro de los 3 puntos)
- [x] 36. Página pública del cliente `/t/[código]`: estado de la orden bilingüe, solo primer nombre, sin teléfono ni importes, `noindex`, límite de intentos
- [x] 37. Avisos: cola en base, plantillas bilingües editables (recibida, lista, recordatorio), SMS por Twilio y correo, reintentos, STOP con firma de Twilio verificada, solo a quien aceptó; pruebas con MSW
- [x] 38. Reloj `/datos/reloj` protegido con secreto: procesar avisos, recordatorios de ropa sin recoger, respaldo diario cifrado al almacén con retención 30 días, limpieza de papelera, sesiones y límites
- [x] 39. Respaldo y restauración probada (cifrar → descifrar → cargar en base limpia) + exportación de datos del dueño (JSON y CSV)
- [x] 40. Reportes: ventas por día/semana/mes, por servicio, por empleado, por forma de pago; órdenes atrasadas; ropa sin recoger; exportar CSV
- [x] 41. Tablero de inicio `/app` con cifras de hoy y lista de primeros pasos (tienda, precios, empleados, tablet, etiqueta de prueba)
- [ ] 42. Modo sin conexión: PWA (manifest + service worker), caché local en IndexedDB (catálogo, clientes, órdenes abiertas), cola de operaciones con identificadores del dispositivo, sincronización idempotente `/datos/sync`, indicador de conexión
- [ ] 43. Canario `/datos/salud`: base, almacén, variables, correo, SMS, Turnstile, última corrida del reloj, último respaldo

## Fase 1 — Cara pública y documentos

- [ ] 44. Página principal bilingüe (dolores → soluciones, funciones, seguridad, sin conexión, prueba gratis 14 días, preguntas frecuentes) + privacidad y términos (borradores)
- [ ] 45. Docs estilo Wikipedia en `/docs`: grupo de rutas con barra lateral que nunca se pierde, íconos, buscador con ⌘K, tarjetas por sección, «← Docs», cada guía su página, bilingüe, `llms.txt` y sitemap
- [ ] 46. Guías: primeros pasos, recibir ropa, etiquetas, producción, entrega, caja, sin conexión, avisos, página del cliente, dos pasos, dispositivos, autorizaciones, reportes, exportar, respaldos, impresoras

## Fase 1 — Verificación y cierre

- [ ] 47. Pruebas de punta a punta (Playwright): registro → dos pasos → precios → empleado → registrar tablet → PIN → nueva orden → etiquetas → producción → lista → entrega y cobro → cierre de caja; cambio de idioma; celular
- [ ] 48. Verificación visual en el navegador integrado a 375 px y escritorio de cada pantalla, con capturas y revisión de consola
- [ ] 49. Compilación real con OpenNext + empaquetado `_worker.js` con wrangler `--dry-run`, medir tamaño gzip (< 10 MB) y prueba de humo contra el worker compilado
- [ ] 50. `npm run verify` completo en verde (tipos, lint, pruebas con cobertura, build, audit, gitleaks)
- [ ] 51. Documentos: `CANDADOS.md`, `VERIFICAR-PAGOS.md` (sin procesador: solo registro manual, en rojo lo no probado), actualizar `ESTUDIO`, `CLAUDE.md`, `PENDIENTES.md`, README
- [ ] 52. Memoria persistente con el estado del proyecto y commits finales descriptivos
