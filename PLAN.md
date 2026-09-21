# Plan: la impresora se conecta y el recibo sale de un toque

> Piloto automático (20 sep 2026). Richard: «hay muchos saltos para llegar a la
> impresora… está conectada y no se detecta con nada. Quiero arreglarlo de raíz».
>
> Investigado cómo lo hacen los POS en la nube. Hay cuatro caminos y hoy solo
> teníamos el más débil (el diálogo del navegador):
>  1. Diálogo del navegador → universal, pero pide confirmar cada vez.
>  2. **Conexión directa (WebUSB / Web Serial) con comandos ESC/POS** → sin
>     diálogo y sin drivers. Chrome y Edge en Mac, Linux, Android y ChromeOS; en
>     Windows por puerto serie (el driver de Windows acapara el USB).
>  3. Agente local instalado en la tienda → silencioso, pero hay que instalarlo.
>  4. La impresora llama al servidor (Star CloudPRNT) → sin agente, solo Star.

- [x] G1. Codificador ESC/POS propio: texto con acentos, negrita, tamaños, QR
      nativo de la impresora y corte de papel. Con pruebas byte a byte.
- [x] G2. El recibo en líneas, una sola vez en el servidor, para que el papel y
      la pantalla digan lo mismo (respetando la autorización de reimpresión).
- [x] G3. Conexión directa: WebUSB y Web Serial, con el permiso recordado.
- [x] G4. Pantalla **Ajustes → Impresoras**: detecta qué soporta este equipo,
      conecta, imprime una prueba y dice si salió.
- [x] G5. Menos saltos: «Imprimir recibo» manda directo a la impresora conectada,
      sin abrir otra pantalla ni el diálogo. Si no hay, el camino de siempre.
- [x] G6. Candados y pruebas (comprobados en rojo).
- [x] G7. Guía de Docs: los caminos, el modo silencioso de Chrome con su comando
      exacto, y «mi impresora está conectada y no imprime».
- [x] G8. `npm run verify`, punta a punta, paquete, publicar y comprobar en vivo.
