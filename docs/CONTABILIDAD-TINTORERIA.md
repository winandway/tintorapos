# Cómo se lleva la contabilidad de una tintorería

> Investigación del 19 de septiembre de 2026, antes de programar nada. Se leyó
> qué lleva la contabilidad del oficio y qué menús traen los programas que ya se
> venden (Enerpize, CleanMax, Comca Cleaner POS, Hana Retail, Geelus) para
> copiar la forma, no para inventarla.
>
> Fuentes: guía de contabilidad para lavanderías de Laundry Marketing Agency
> (`laundrymarketing.agency/accounting-for-laundry-business-guide/`), módulos de
> Enerpize para tintorerías (`enerpize.com/dry-cleaning-management-software/`),
> comparativas de Capterra y GetApp de software de tintorerías (septiembre 2026).

## Lo que de verdad lleva una tintorería

Una tintorería no necesita un ERP contable: necesita saber **cuánto entró,
cuánto salió y cuánto quedó**, con el detalle suficiente para que su contador
haga la declaración sin pedirle una caja de papeles.

### 1. Ingresos, separados por servicio

No basta con «ventas del mes». El oficio separa: lavado en seco, lavado y
planchado, planchado, lavado por libra, arreglos y (si hay) reparto. Cada
servicio tiene un margen distinto —el lavado en seco llega al 60 %, el lavado
por libra anda por el 40–50 %— y el dueño decide precios mirando esa diferencia.
**Eso ya lo teníamos**: los reportes salen por servicio, por día y por empleado.

### 2. Costo directo: los insumos

Lo que se gasta EN la ropa y sube o baja con el volumen: ganchos de alambre,
bolsas de plástico, detergente, solvente, quitamanchas, hombreras, etiquetas.
Se compra por caja a un proveedor y se consume a diario. Dos cosas hacen falta:
**la compra** (cuánto costó, a quién, cuándo se paga) y **la existencia** (cuánto
queda y cuándo hay que volver a pedir).

### 3. Gastos de operación

Los que no dependen del volumen del día:

| Grupo | Ejemplos del oficio |
| --- | --- |
| Local | Renta, seguro, licencias y permisos |
| Servicios | Luz, agua, gas, basura, teléfono e internet |
| Gente | Sueldos, horas extra, aportes, uniformes |
| Máquinas | Mantenimiento, repuestos, técnico, caldera |
| Movimiento | Gasolina, mantenimiento de la camioneta de reparto |
| Venta | Publicidad, volantes, comisiones de tarjeta |
| Oficina | Software, papelería, contador |

La luz y el agua de una tintorería pesan entre el **15 % y el 25 %** de la
venta, y la mano de obra entre el **10 % y el 20 %**. Son los dos números que
el dueño tiene que ver en grande todos los meses.

### 4. Ganancia (el estado de resultados)

`Ventas − insumos − gastos = ganancia`. Con el porcentaje de cada grupo sobre
la venta, y la comparación contra el mes anterior. El margen sano del oficio
está entre **20 % y 35 %**.

### 5. Impuesto sobre la venta

En casi todos los estados de EE.UU. el servicio de tintorería **sí** paga
impuesto y hay renglones exentos. El programa tiene que separar **venta gravada
y venta exenta** y decir cuánto impuesto se cobró en el período, que es
exactamente lo que se declara.

### 6. Cuentas por cobrar (clientes de empresa)

Hoteles, restaurantes y consultorios no pagan en el mostrador: se les factura a
15 o 30 días. Hace falta ver **quién debe, cuánto y desde cuándo** (0–10, 11–30,
31–60 y más de 60 días) y cuántos días tarda el dinero en llegar.

### 7. Lo que se le entrega al contador

Un archivo con el libro del período: ventas por día, gastos, compras e impuesto
cobrado. Lo demás lo hace él.

## Lo que NO va en este programa (a propósito)

- **Partida doble, balance general y libro mayor.** Eso es del contador; un
  dueño de tintorería no lo usa y complicarlo hace que no se use nada.
- **Nómina completa** (retenciones, impuestos al empleado, formularios). Se
  registra el pago como gasto, con el nombre del empleado. El cálculo legal va
  en el programa de nómina de cada país.
- **Depreciación de equipos.** La calcula el contador una vez al año.

## Los menús que se copiaron

Los programas del rubro que ya se venden traen, con otros nombres, lo mismo:
gastos, compras a proveedores, proveedores, inventario de insumos, reportes
financieros y cuentas por cobrar. Nuestro menú **Contabilidad** queda así:

| Pantalla | Para qué sirve, en palabras normales |
| --- | --- |
| **Ganancia** | Cuánto entró, cuánto salió y cuánto quedó, por día, semana, mes o rango, con los porcentajes de luz y de gente |
| **Gastos** | Todo lo que sale de la caja: renta, luz, sueldos, mantenimiento… con su categoría |
| **Compras** | Lo que se le compró a un proveedor, con su factura, y si está pagada o por pagar |
| **Insumos** | Ganchos, bolsas, detergente: cuánto queda, cuándo pedir más |
| **Proveedores** | A quién se le compra, su teléfono y a cuántos días paga uno |
| **Por cobrar** | Los clientes que deben, con la antigüedad de la deuda |
| **Impuestos** | Venta gravada, venta exenta e impuesto cobrado del período |
| **Para el contador** | El archivo con todo el período, listo para mandar |
