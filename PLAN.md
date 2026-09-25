# Plan: que lo que se hace en un equipo se vea en los demás, y que nada quede «hecho» sin estarlo

> Emergencia (22 sep 2026). Richard: «las actualizaciones no se están
> actualizando; por más que damos salida y procesamos no pasa nada».
> Comprobado en vivo con el demo: el servidor sí guarda y responde (marcar
> «Lista» actualiza la orden, la lista y la página del cliente). Lo que falla
> está en el celular: pantallas que no se refrescan solas, un botón de
> entregar que se apaga sin decir por qué (y se apaga por error para quien no
> puede abrir caja), y un modo «sin conexión» que puede dar por hecho lo que no
> llegó. Y no hay forma de ver desde afuera qué falló en un teléfono.

- [x] K1. La página del cliente (/t/…) se actualiza sola mientras está abierta
      (cada 30 s y al volver a la pestaña), sin recargar.
- [x] K2. Las pantallas de la tienda (producción, entregar, órdenes, orden,
      inicio) se refrescan al volver a la pestaña, cada minuto y después de
      subir la cola.
- [x] K3. Entregar: el botón NUNCA se apaga. Con efectivo y caja cerrada, abre
      la caja ahí mismo (si puede) o explica qué hacer. El estado de la caja
      sale de una ruta ligera que no exige el permiso de abrir caja (hoy un
      repartidor veía «caja cerrada» aunque estuviera abierta).
- [x] K4. Cola honesta: si el envío falla con internet, se reintenta una vez;
      si vuelve a fallar, queda en la cola PERO la pantalla lo dice en ámbar
      («guardado en este equipo, subiendo…»), nunca en verde; la tarjeta se
      actualiza igual; la cola se sube de inmediato y al terminar se refrescan
      las pantallas.
- [x] K5. Diagnóstico: cada fallo de red o de servidor en el teléfono se
      reporta (sin datos personales) y se ve en /datos/salud, para saber desde
      afuera qué pasa en un equipo.
- [x] K6. Pruebas comprobadas en rojo: reintento y cola, ruta de diagnóstico,
      estado de caja para quien no abre caja, página del cliente en vivo.
- [x] K7. Guías (sin conexión, entrega, página del cliente), CANDADOS B44,
      CLAUDE.md y PENDIENTES.
- [x] K8. verify, punta a punta, paquete, publicar y comprobar en vivo.
- [x] K9. Revisión a fondo (25 sep): recorrido completo reproducido en WebKit
      (Safari) contra el sitio en vivo; orden ya entregada se dice claro al
      volver a escanearla; página del cliente consulta al abrirse; detalle de
      fallos de teléfonos público en /datos/salud; guion en scripts/repro-webkit.mjs.
