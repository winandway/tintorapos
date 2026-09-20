-- Tintora POS — esquema de la base (SQLite de YaDominios Cloud, env.DB).
-- IDEMPOTENTE: la plataforma lo ejecuta en CADA publicación.
-- Reglas: toda tabla de negocio lleva tintoreria_id; fechas en milisegundos UTC
-- (*_en); dinero en centavos enteros (*_cents); porcentajes en puntos básicos (*_bps).
-- Para cambiar una tabla existente NO se edita el CREATE: se agrega una migración
-- (ver CANDADOS.md, «Cómo cambiar el esquema»).

CREATE TABLE IF NOT EXISTS tintorerias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado_region TEXT,
  codigo_postal TEXT,
  pais TEXT NOT NULL DEFAULT 'US',
  zona_horaria TEXT NOT NULL DEFAULT 'America/New_York',
  moneda TEXT NOT NULL DEFAULT 'USD',
  idioma TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  impuesto_bps INTEGER NOT NULL DEFAULT 0 CHECK (impuesto_bps BETWEEN 0 AND 5000),
  recargo_urgente_bps INTEGER NOT NULL DEFAULT 5000 CHECK (recargo_urgente_bps BETWEEN 0 AND 20000),
  descuento_max_bps INTEGER NOT NULL DEFAULT 1000 CHECK (descuento_max_bps BETWEEN 0 AND 10000),
  dias_entrega INTEGER NOT NULL DEFAULT 2,
  dias_recordatorio INTEGER NOT NULL DEFAULT 7,
  max_recordatorios INTEGER NOT NULL DEFAULT 3,
  dias_abandono INTEGER NOT NULL DEFAULT 90,
  bloqueo_inactividad_min INTEGER NOT NULL DEFAULT 10,
  plantillas TEXT NOT NULL DEFAULT '{}',
  plan TEXT NOT NULL DEFAULT 'prueba',
  prueba_hasta INTEGER,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida')),
  proximo_numero INTEGER NOT NULL DEFAULT 1001,
  creada_en INTEGER NOT NULL,
  actualizada_en INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sucursales (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  activa INTEGER NOT NULL DEFAULT 1,
  creada_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sucursales_tintoreria ON sucursales (tintoreria_id);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('dueno', 'gerente', 'cajero', 'planta', 'repartidor')),
  correo TEXT,
  clave_hash TEXT,
  debe_cambiar_clave INTEGER NOT NULL DEFAULT 0,
  pin_hash TEXT,
  pin_intentos INTEGER NOT NULL DEFAULT 0,
  pin_bloqueado_hasta INTEGER,
  totp_secreto TEXT,
  totp_activo INTEGER NOT NULL DEFAULT 0,
  totp_ultimo_paso INTEGER,
  codigos_respaldo TEXT NOT NULL DEFAULT '[]',
  activo INTEGER NOT NULL DEFAULT 1,
  ultimo_ingreso_en INTEGER,
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios (correo) WHERE correo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_tintoreria ON usuarios (tintoreria_id, activo);

-- Permisos a la medida de un empleado (palomitas). Si no hay fila, manda su rol.
CREATE TABLE IF NOT EXISTS permisos_usuario (
  usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id),
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  permisos TEXT NOT NULL,
  actualizado_en INTEGER NOT NULL,
  actualizado_por TEXT REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_permisos_usuario_tintoreria ON permisos_usuario (tintoreria_id);

CREATE TABLE IF NOT EXISTS dispositivos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT NOT NULL REFERENCES sucursales(id),
  nombre TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  agente TEXT,
  creado_por TEXT NOT NULL REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  ultimo_uso_en INTEGER,
  revocado_en INTEGER,
  revocado_por TEXT REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_dispositivos_tintoreria ON dispositivos (tintoreria_id);

-- Enlace de un solo uso para conectar un celular escaneando un QR desde la tablet.
CREATE TABLE IF NOT EXISTS enlaces_dispositivo (
  hash TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT NOT NULL REFERENCES sucursales(id),
  nombre TEXT NOT NULL,
  creado_por TEXT NOT NULL REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  expira_en INTEGER NOT NULL,
  usado_en INTEGER,
  dispositivo_id TEXT REFERENCES dispositivos(id)
);
CREATE INDEX IF NOT EXISTS idx_enlaces_dispositivo_expira ON enlaces_dispositivo (expira_en);

CREATE TABLE IF NOT EXISTS sesiones (
  id_hash TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  dispositivo_id TEXT REFERENCES dispositivos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('cuenta', 'pin')),
  segundo_factor_ok INTEGER NOT NULL DEFAULT 0,
  creada_en INTEGER NOT NULL,
  ultima_actividad_en INTEGER NOT NULL,
  expira_en INTEGER NOT NULL,
  agente TEXT
);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones (tintoreria_id, usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones (expira_en);

CREATE TABLE IF NOT EXISTS tokens_recuperacion (
  hash TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  expira_en INTEGER NOT NULL,
  usado_en INTEGER
);

-- Verificación del correo del dueño (y de cualquier usuario con correo).
CREATE TABLE IF NOT EXISTS verificacion_correo (
  usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id),
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  correo TEXT NOT NULL,
  hash TEXT,
  creado_en INTEGER NOT NULL,
  expira_en INTEGER,
  verificado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_verificacion_correo_hash ON verificacion_correo (hash);

CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre TEXT NOT NULL,
  apellido TEXT,
  telefono TEXT,
  telefono_digitos TEXT,
  correo TEXT,
  idioma TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  preferencias TEXT NOT NULL DEFAULT '{}',
  notas TEXT,
  acepta_sms INTEGER NOT NULL DEFAULT 0,
  acepta_sms_en INTEGER,
  acepta_correo INTEGER NOT NULL DEFAULT 0,
  acepta_correo_en INTEGER,
  sms_baja_en INTEGER,
  creado_por TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL,
  eliminado_en INTEGER,
  anonimizado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (tintoreria_id, telefono_digitos);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (tintoreria_id, nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_actualizado ON clientes (tintoreria_id, actualizado_en);

CREATE TABLE IF NOT EXISTS catalogo_prendas (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre_es TEXT NOT NULL,
  nombre_en TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prendas_tintoreria ON catalogo_prendas (tintoreria_id, activo, orden);

CREATE TABLE IF NOT EXISTS catalogo_servicios (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre_es TEXT NOT NULL,
  nombre_en TEXT,
  unidad TEXT NOT NULL DEFAULT 'pieza' CHECK (unidad IN ('pieza', 'libra')),
  aplica_impuesto INTEGER NOT NULL DEFAULT 1,
  dias_entrega INTEGER,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_servicios_tintoreria ON catalogo_servicios (tintoreria_id, activo, orden);

-- prenda_id = '' para precios que no dependen de la prenda (por libra).
CREATE TABLE IF NOT EXISTS precios (
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  servicio_id TEXT NOT NULL REFERENCES catalogo_servicios(id),
  prenda_id TEXT NOT NULL DEFAULT '',
  precio_cents INTEGER NOT NULL CHECK (precio_cents >= 0),
  actualizado_en INTEGER NOT NULL,
  PRIMARY KEY (tintoreria_id, servicio_id, prenda_id)
);

CREATE TABLE IF NOT EXISTS turnos_caja (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT NOT NULL REFERENCES sucursales(id),
  dispositivo_id TEXT REFERENCES dispositivos(id),
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  abierto_por TEXT NOT NULL REFERENCES usuarios(id),
  abierto_en INTEGER NOT NULL,
  fondo_cents INTEGER NOT NULL CHECK (fondo_cents >= 0),
  cerrado_por TEXT REFERENCES usuarios(id),
  cerrado_en INTEGER,
  contado_cents INTEGER,
  esperado_cents INTEGER,
  diferencia_cents INTEGER,
  notas TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_turno_abierto ON turnos_caja (tintoreria_id, sucursal_id) WHERE estado = 'abierto';
CREATE INDEX IF NOT EXISTS idx_turnos_tintoreria ON turnos_caja (tintoreria_id, abierto_en);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  turno_id TEXT NOT NULL REFERENCES turnos_caja(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'sin_venta')),
  monto_cents INTEGER NOT NULL CHECK (monto_cents >= 0),
  motivo TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  autorizado_por TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movimientos_turno ON movimientos_caja (tintoreria_id, turno_id);

CREATE TABLE IF NOT EXISTS ordenes (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT NOT NULL REFERENCES sucursales(id),
  numero INTEGER NOT NULL,
  codigo_publico TEXT NOT NULL UNIQUE,
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  estado TEXT NOT NULL DEFAULT 'recibida'
    CHECK (estado IN ('recibida', 'en_proceso', 'lista', 'entregada', 'anulada', 'abandonada')),
  urgente INTEGER NOT NULL DEFAULT 0,
  fecha_promesa INTEGER NOT NULL,
  notas TEXT,
  subtotal_cents INTEGER NOT NULL,
  recargo_cents INTEGER NOT NULL DEFAULT 0,
  descuento_cents INTEGER NOT NULL DEFAULT 0,
  descuento_motivo TEXT,
  impuesto_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  pagado_cents INTEGER NOT NULL DEFAULT 0,
  impuesto_bps INTEGER NOT NULL DEFAULT 0,
  recargo_bps INTEGER NOT NULL DEFAULT 0,
  creada_por TEXT NOT NULL REFERENCES usuarios(id),
  autorizado_por TEXT REFERENCES usuarios(id),
  dispositivo_id TEXT REFERENCES dispositivos(id),
  origen TEXT NOT NULL DEFAULT 'en_linea' CHECK (origen IN ('en_linea', 'sin_conexion')),
  fecha_local TEXT NOT NULL,
  creada_en INTEGER NOT NULL,
  actualizada_en INTEGER NOT NULL,
  lista_en INTEGER,
  entregada_en INTEGER,
  entregada_por TEXT REFERENCES usuarios(id),
  anulada_en INTEGER,
  anulada_por TEXT REFERENCES usuarios(id),
  anulada_motivo TEXT,
  recordatorios_enviados INTEGER NOT NULL DEFAULT 0,
  ultimo_recordatorio_en INTEGER,
  UNIQUE (tintoreria_id, numero),
  -- Candado de dinero: nunca se cobra más de lo que vale la orden.
  CHECK (pagado_cents >= 0 AND pagado_cents <= total_cents)
);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes (tintoreria_id, estado, fecha_promesa);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes (tintoreria_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes (tintoreria_id, fecha_local);
CREATE INDEX IF NOT EXISTS idx_ordenes_actualizada ON ordenes (tintoreria_id, actualizada_en);

-- Una fila por pieza física (o por bolsa en servicios por libra): cada una
-- lleva su etiqueta con QR, su estado y su lugar en el rack.
CREATE TABLE IF NOT EXISTS orden_prendas (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  orden_id TEXT NOT NULL REFERENCES ordenes(id),
  prenda_id TEXT,
  servicio_id TEXT,
  prenda_es TEXT NOT NULL,
  prenda_en TEXT,
  servicio_es TEXT NOT NULL,
  servicio_en TEXT,
  unidad TEXT NOT NULL DEFAULT 'pieza' CHECK (unidad IN ('pieza', 'libra')),
  cantidad REAL NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unit_cents INTEGER NOT NULL CHECK (precio_unit_cents >= 0),
  total_cents INTEGER NOT NULL,
  aplica_impuesto INTEGER NOT NULL DEFAULT 1,
  color TEXT,
  marca TEXT,
  notas TEXT,
  codigo_etiqueta TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'recibida'
    CHECK (estado IN ('recibida', 'en_proceso', 'lista', 'entregada', 'anulada', 'abandonada')),
  ubicacion TEXT,
  posicion INTEGER NOT NULL DEFAULT 0,
  creada_en INTEGER NOT NULL,
  actualizada_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prendas_orden ON orden_prendas (tintoreria_id, orden_id);

CREATE TABLE IF NOT EXISTS orden_estados (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  orden_id TEXT NOT NULL REFERENCES ordenes(id),
  prenda_id TEXT REFERENCES orden_prendas(id),
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  ubicacion TEXT,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  dispositivo_id TEXT REFERENCES dispositivos(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_estados_orden ON orden_estados (tintoreria_id, orden_id, creado_en);

CREATE TABLE IF NOT EXISTS fotos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  orden_id TEXT NOT NULL REFERENCES ordenes(id),
  prenda_id TEXT REFERENCES orden_prendas(id),
  clave_objeto TEXT NOT NULL UNIQUE,
  bytes INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  creado_por TEXT NOT NULL REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON fotos (tintoreria_id, orden_id);

CREATE TABLE IF NOT EXISTS pagos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  orden_id TEXT NOT NULL REFERENCES ordenes(id),
  turno_id TEXT REFERENCES turnos_caja(id),
  metodo TEXT NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta_externa', 'otro')),
  monto_cents INTEGER NOT NULL CHECK (monto_cents > 0),
  referencia TEXT,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  dispositivo_id TEXT REFERENCES dispositivos(id),
  origen TEXT NOT NULL DEFAULT 'en_linea' CHECK (origen IN ('en_linea', 'sin_conexion')),
  fecha_local TEXT NOT NULL,
  creado_en INTEGER NOT NULL,
  anulado_en INTEGER,
  anulado_por TEXT REFERENCES usuarios(id),
  autorizado_por TEXT REFERENCES usuarios(id),
  anulado_motivo TEXT
);
CREATE INDEX IF NOT EXISTS idx_pagos_orden ON pagos (tintoreria_id, orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos (tintoreria_id, fecha_local);
CREATE INDEX IF NOT EXISTS idx_pagos_turno ON pagos (tintoreria_id, turno_id);

CREATE TABLE IF NOT EXISTS avisos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  orden_id TEXT REFERENCES ordenes(id),
  cliente_id TEXT REFERENCES clientes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('recibida', 'lista', 'recordatorio', 'prueba')),
  canal TEXT NOT NULL CHECK (canal IN ('sms', 'correo')),
  destino TEXT NOT NULL,
  idioma TEXT NOT NULL DEFAULT 'es',
  asunto TEXT,
  cuerpo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido', 'omitido')),
  intentos INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  proveedor_id TEXT,
  programado_en INTEGER NOT NULL,
  enviado_en INTEGER,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_avisos_cola ON avisos (estado, programado_en);
CREATE INDEX IF NOT EXISTS idx_avisos_tintoreria ON avisos (tintoreria_id, creado_en);

-- Auditoría: SOLO SE AGREGA. Los triggers impiden editar o borrar, incluso por
-- error de código. Nunca guarda datos personales (solo identificadores).
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  usuario_id TEXT,
  autorizado_por TEXT,
  dispositivo_id TEXT,
  accion TEXT NOT NULL,
  entidad TEXT,
  entidad_id TEXT,
  detalle TEXT NOT NULL DEFAULT '{}',
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auditoria_tintoreria ON auditoria (tintoreria_id, creado_en);
CREATE TRIGGER IF NOT EXISTS auditoria_sin_editar BEFORE UPDATE ON auditoria
BEGIN
  SELECT RAISE(ABORT, 'La auditoria no se puede editar');
END;
-- La auditoría de una tintorería DE VERDAD no se borra nunca. La única excepción
-- son las tintorerías de demostración (plan 'demo'), que se borran enteras a las
-- 24 horas. Se vuelve a crear en cada publicación para que el candado no quede
-- con la definición vieja.
DROP TRIGGER IF EXISTS auditoria_sin_borrar;
CREATE TRIGGER IF NOT EXISTS auditoria_sin_borrar BEFORE DELETE ON auditoria
WHEN NOT EXISTS (SELECT 1 FROM tintorerias t WHERE t.id = OLD.tintoreria_id AND t.plan = 'demo')
BEGIN
  SELECT RAISE(ABORT, 'La auditoria no se puede borrar');
END;

CREATE TABLE IF NOT EXISTS respaldos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  clave_objeto TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  filas INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  creado_en INTEGER NOT NULL,
  borrado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_respaldos_tintoreria ON respaldos (tintoreria_id, creado_en);

-- Operaciones hechas sin conexión y ya aplicadas: reintentar no duplica nada.
CREATE TABLE IF NOT EXISTS operaciones_sync (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  dispositivo_id TEXT,
  tipo TEXT NOT NULL,
  resultado TEXT NOT NULL,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_tintoreria ON operaciones_sync (tintoreria_id, creado_en);

-- Tablas del sistema (no son de ninguna tintorería).
-- Mensajes del formulario de contacto del sitio (no son de ninguna tintorería).
CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  asunto TEXT,
  mensaje TEXT NOT NULL,
  idioma TEXT NOT NULL DEFAULT 'es',
  ip_hash TEXT,
  enviado_en INTEGER,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensajes_contacto_fecha ON mensajes_contacto (creado_en);

CREATE TABLE IF NOT EXISTS limites (
  clave TEXT PRIMARY KEY,
  conteo INTEGER NOT NULL,
  reinicia_en INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sistema (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- Contabilidad de la tintorería (ver docs/CONTABILIDAD-TINTORERIA.md).
-- Nada de partida doble: lo que el dueño usa de verdad — lo que sale de la
-- caja, lo que se le compra a un proveedor y cuánto queda de cada insumo.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS proveedores (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  contacto TEXT,
  terminos_dias INTEGER NOT NULL DEFAULT 0 CHECK (terminos_dias BETWEEN 0 AND 365),
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_por TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL,
  eliminado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_proveedores_tienda ON proveedores (tintoreria_id, activo, nombre);

CREATE TABLE IF NOT EXISTS insumos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'unidad',
  existencia REAL NOT NULL DEFAULT 0,
  minimo REAL NOT NULL DEFAULT 0,
  costo_unit_cents INTEGER NOT NULL DEFAULT 0 CHECK (costo_unit_cents >= 0),
  proveedor_id TEXT REFERENCES proveedores(id),
  activo INTEGER NOT NULL DEFAULT 1,
  orden INTEGER NOT NULL DEFAULT 0,
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_insumos_tienda ON insumos (tintoreria_id, activo, orden);

CREATE TABLE IF NOT EXISTS compras (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT REFERENCES sucursales(id),
  proveedor_id TEXT REFERENCES proveedores(id),
  numero_factura TEXT,
  fecha_local TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  impuesto_cents INTEGER NOT NULL DEFAULT 0 CHECK (impuesto_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  pagado_cents INTEGER NOT NULL DEFAULT 0 CHECK (pagado_cents >= 0),
  vence_en INTEGER,
  notas TEXT,
  creado_por TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL,
  eliminado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_compras_tienda ON compras (tintoreria_id, fecha_local);

CREATE TABLE IF NOT EXISTS compra_lineas (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  compra_id TEXT NOT NULL REFERENCES compras(id),
  insumo_id TEXT REFERENCES insumos(id),
  descripcion TEXT NOT NULL,
  cantidad REAL NOT NULL CHECK (cantidad > 0),
  costo_unit_cents INTEGER NOT NULL CHECK (costo_unit_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  creada_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_compra_lineas_compra ON compra_lineas (tintoreria_id, compra_id);

-- El libro de lo que sale de la caja. Una compra a proveedor escribe TAMBIÉN
-- su gasto (con compra_id), así la ganancia se calcula de una sola tabla y
-- nada se cuenta dos veces.
CREATE TABLE IF NOT EXISTS gastos (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  sucursal_id TEXT REFERENCES sucursales(id),
  categoria TEXT NOT NULL,
  proveedor_id TEXT REFERENCES proveedores(id),
  compra_id TEXT REFERENCES compras(id),
  empleado_id TEXT REFERENCES usuarios(id),
  descripcion TEXT,
  monto_cents INTEGER NOT NULL CHECK (monto_cents > 0),
  metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
  referencia TEXT,
  fecha_local TEXT NOT NULL,
  creado_por TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL,
  actualizado_en INTEGER NOT NULL,
  eliminado_en INTEGER
);
CREATE INDEX IF NOT EXISTS idx_gastos_tienda ON gastos (tintoreria_id, fecha_local);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos (tintoreria_id, categoria, fecha_local);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gastos_compra ON gastos (compra_id) WHERE compra_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS movimientos_insumo (
  id TEXT PRIMARY KEY,
  tintoreria_id TEXT NOT NULL REFERENCES tintorerias(id),
  insumo_id TEXT NOT NULL REFERENCES insumos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'consumo', 'ajuste')),
  cantidad REAL NOT NULL,
  existencia_despues REAL NOT NULL,
  motivo TEXT,
  compra_id TEXT REFERENCES compras(id),
  usuario_id TEXT REFERENCES usuarios(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movimientos_insumo ON movimientos_insumo (tintoreria_id, insumo_id, creado_en);
