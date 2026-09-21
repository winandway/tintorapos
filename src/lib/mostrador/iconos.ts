/**
 * Qué dibujo le toca a cada prenda del catálogo. El dueño escribe el nombre que
 * quiera (en español o en inglés) y aquí se decide el ícono por palabra clave.
 * Función pura: se prueba sola en `tests/unit/iconos-prendas.test.ts`.
 */
export type ClaveIcono =
  | "camisa"
  | "blusa"
  | "camiseta"
  | "pantalon"
  | "jeans"
  | "falda"
  | "vestido"
  | "vestidoLargo"
  | "novia"
  | "saco"
  | "traje"
  | "chaqueta"
  | "abrigo"
  | "sueter"
  | "corbata"
  | "uniforme"
  | "ropaInterior"
  | "edredon"
  | "cobija"
  | "sabanas"
  | "almohada"
  | "toalla"
  | "cortina"
  | "mantel"
  | "alfombra"
  | "zapatos"
  | "bolso"
  | "gorra"
  | "canasta"
  | "percha";

/** Orden IMPORTANTE: lo más específico primero («vestido de novia» antes que «vestido»). */
const CLAVES: [ClaveIcono, string[]][] = [
  ["novia", ["novia", "wedding", "bridal"]],
  ["vestidoLargo", ["fiesta", "gala", "noche", "gown", "evening", "formal dress", "quince"]],
  ["traje", ["traje", "suit", "esmoquin", "tuxedo", "smoking"]],
  ["saco", ["saco", "blazer", "sport coat", "americana"]],
  ["abrigo", ["abrigo", "coat", "gabardina", "trench", "parka", "sobretodo"]],
  ["chaqueta", ["chaqueta", "jacket", "campera", "chamarra", "cazadora", "hoodie", "sudadera"]],
  ["sueter", ["sueter", "suéter", "sweater", "jersey", "pullover", "cardigan", "chaleco", "vest"]],
  ["corbata", ["corbata", "tie", "corbatin", "corbatín", "bow tie", "pajarita"]],
  ["uniforme", ["uniforme", "uniform", "scrub", "bata", "overol", "overall", "coverall", "delantal"]],
  ["camiseta", ["camiseta", "t-shirt", "tshirt", "tee", "polo", "playera", "franela", "top"]],
  ["blusa", ["blusa", "blouse"]],
  ["camisa", ["camisa", "shirt"]],
  ["jeans", ["jean", "denim", "vaquero", "mezclilla"]],
  ["pantalon", ["pantalon", "pantalón", "pants", "trouser", "slack", "short", "bermuda", "legging"]],
  ["falda", ["falda", "skirt", "pollera"]],
  ["vestido", ["vestido", "dress"]],
  [
    "ropaInterior",
    ["interior", "underwear", "lingerie", "lenceria", "lencería", "bikini", "sujetador", "bra"],
  ],
  ["edredon", ["edredon", "edredón", "comforter", "duvet", "nordico", "nórdico", "cobertor", "quilt"]],
  ["cobija", ["cobija", "manta", "blanket", "frazada", "colcha", "throw"]],
  ["sabanas", ["sabana", "sábana", "sheet", "bedding", "juego de cama", "cama", "bed"]],
  ["almohada", ["almohada", "pillow", "cojin", "cojín", "cushion", "funda"]],
  ["toalla", ["toalla", "towel", "albornoz", "bathrobe", "robe", "bata de baño"]],
  ["cortina", ["cortina", "curtain", "drape", "visillo", "persiana"]],
  ["mantel", ["mantel", "tablecloth", "servilleta", "napkin", "runner", "camino de mesa"]],
  ["alfombra", ["alfombra", "rug", "carpet", "tapete", "tapiz"]],
  ["zapatos", ["zapato", "shoe", "bota", "boot", "sneaker", "tenis", "calzado", "sandalia"]],
  ["bolso", ["bolso", "bolsa", "bag", "cartera", "purse", "handbag", "mochila", "backpack", "maleta"]],
  ["gorra", ["gorra", "cap", "sombrero", "hat", "bufanda", "scarf", "guante", "glove"]],
  [
    "canasta",
    ["libra", "pound", "lb", "kilo", "kg", "granel", "wash & fold", "wash and fold", "carga", "load"],
  ],
];

const LETRA = /[a-z0-9]/;

/**
 * Busca la palabra COMPLETA (admitiendo el plural), no un pedazo. Sin esto,
 * «vest» del inglés casaba dentro de «vestido» y una prenda salía con el dibujo
 * de otra. Comprobado en rojo en `tests/unit/iconos-prendas.test.ts`.
 */
function contienePalabra(texto: string, palabra: string): boolean {
  for (let desde = 0; ; desde = desde + 1) {
    const i = texto.indexOf(palabra, desde);
    if (i < 0) return false;
    const antes = i === 0 ? " " : texto[i - 1]!;
    let fin = i + palabra.length;
    if (texto.slice(fin, fin + 2) === "es") fin += 2;
    else if (texto[fin] === "s") fin += 1;
    const despues = fin >= texto.length ? " " : texto[fin]!;
    if (!LETRA.test(antes) && !LETRA.test(despues)) return true;
    desde = i;
  }
}

/** Quita acentos y mayúsculas para comparar «Pantalón» con «pantalon». */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** El ícono de una prenda o servicio. Si no reconoce el nombre, devuelve la percha. */
export function iconoDePrenda(...nombres: (string | null | undefined)[]): ClaveIcono {
  const texto = normalizar(nombres.filter(Boolean).join(" "));
  if (!texto) return "percha";
  for (const [clave, palabras] of CLAVES) {
    for (const palabra of palabras) if (contienePalabra(texto, normalizar(palabra))) return clave;
  }
  return "percha";
}
