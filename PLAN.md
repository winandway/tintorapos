# Plan: las etiquetas también salen directo, y se pueden probar hoy

> Piloto automático (20 sep 2026). El recibo ya sale directo por la impresora
> conectada (probado por Richard con su impresora). Falta lo mismo para las
> etiquetas: hoy solo se conecta UNA impresora y las etiquetas siguen saliendo
> por la ventana del navegador con «Guardar como PDF».
>
> Investigado: las etiqueteras no hablan ESC/POS. Hablan **TSPL** (Rollo,
> Munbyn, Polono, iDPRT, TSC, Xprinter: casi todas las económicas) o **ZPL**
> (Zebra). Y una térmica de recibos también puede sacar etiquetas de papel.

- [x] H1. Codificadores de etiqueta: TSPL, ZPL y ESC/POS (para sacar las
      etiquetas por la impresora de recibos). QR nativo en los tres.
- [x] H2. Ruta con los datos de las etiquetas de una orden.
- [x] H3. Dos impresoras por equipo: la de recibos y la de etiquetas, cada una
      con su conexión, y la opción «usar la misma de recibos».
- [x] H4. Pantalla Impresoras con las dos tarjetas, lenguaje, tamaño y prueba.
- [x] H5. «Imprimir etiquetas» directo, con un toque, igual que el recibo.
- [x] H6. Candados y pruebas (comprobados en rojo).
- [x] H7. Guía de Docs: qué etiquetera comprar, cómo conectarla y cómo probar
      sin tener una.
- [x] H8. `npm run verify`, punta a punta, paquete, publicar y comprobar en vivo.
