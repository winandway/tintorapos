# Plan: recibo digital por correo y cobro por kilo

> Piloto automático (21 sep 2026). Richard reportó: (1) al cliente no le llega
> el correo con su recibo digital; (2) falta cobrar por kilo (Colombia no usa
> libras); (3) el nombre de su tienda quedó mal escrito.
>
> Diagnóstico: el aviso «orden recibida» viene APAGADO de fábrica y, encendido,
> es una sola línea de texto, no un recibo. El dominio sí está bien configurado
> para enviar (DKIM, SPF del rebote y DMARC comprobados). El peso está clavado
> en libras en todas las pantallas y en el papel.

- [x] J1. Unidad de peso por tienda (`lb` / `kg`): preferencia `unidad_peso`, de
      fábrica según el país (EE.UU. y Puerto Rico en libras; el resto en kilos),
      editable en Ajustes → Tienda.
- [x] J2. Mostrador, orden, recibo de pantalla, recibo directo (ESC/POS), editor
      de precios y catálogo hablan en la unidad de la tienda.
- [x] J3. Tienda nueva fuera de EE.UU.: el servicio de fábrica nace como «Lavado
      por kilo».
- [x] J4. Recibo digital en HTML, salido de las MISMAS líneas que el recibo de
      papel (`lineasRecibo`), con botón para ver la orden.
- [x] J5. El recibo por correo sale SOLO al crear la orden (encendido de fábrica,
      con su interruptor en Ajustes → Avisos). El SMS de «recibida» sigue apagado.
      Remitente con el nombre de la tienda y respuesta al correo de la tienda.
- [x] J6. En la orden: «Enviar recibo por correo» y el estado del envío a la
      vista (enviado, en cola o falló, con el porqué). En el mostrador: aviso
      discreto si el cliente no tiene correo.
- [x] J7. Candados y pruebas comprobadas en rojo; CANDADOS, guías de Docs
      (avisos y precios por peso), CLAUDE.md y PENDIENTES.
- [x] J8. `npm run verify`, punta a punta, paquete, publicar y comprobar en vivo.
- [x] J9. Nombre de la tienda: comprobar que se puede corregir y no hay fallo;
      dejar la pregunta del nombre exacto en el bloque final.
