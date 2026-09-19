/**
 * Todos los países del mundo, con su moneda. El nombre NO se escribe aquí: lo
 * pone el navegador en el idioma de la persona (`Intl.DisplayNames`), así
 * «Venezuela», «Rumania» o «România» salen bien escritos sin mantener listas.
 *
 * Antes solo había 18 países en el formulario y faltaban Venezuela, Rumania y
 * casi el mundo entero: un dueño de tintorería de esos países no podía ni
 * registrarse.
 */
export const MONEDA_DE_PAIS: Record<string, string> = {
  AD: "EUR",
  AE: "AED",
  AF: "AFN",
  AG: "XCD",
  AI: "XCD",
  AL: "ALL",
  AM: "AMD",
  AO: "AOA",
  AR: "ARS",
  AS: "USD",
  AT: "EUR",
  AU: "AUD",
  AW: "AWG",
  AX: "EUR",
  AZ: "AZN",
  BA: "BAM",
  BB: "BBD",
  BD: "BDT",
  BE: "EUR",
  BF: "XOF",
  BG: "BGN",
  BH: "BHD",
  BI: "BIF",
  BJ: "XOF",
  BL: "EUR",
  BM: "BMD",
  BN: "BND",
  BO: "BOB",
  BQ: "USD",
  BR: "BRL",
  BS: "BSD",
  BT: "BTN",
  BW: "BWP",
  BY: "BYN",
  BZ: "BZD",
  CA: "CAD",
  CD: "CDF",
  CF: "XAF",
  CG: "XAF",
  CH: "CHF",
  CI: "XOF",
  CK: "NZD",
  CL: "CLP",
  CM: "XAF",
  CN: "CNY",
  CO: "COP",
  CR: "CRC",
  CU: "CUP",
  CV: "CVE",
  CW: "ANG",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DJ: "DJF",
  DK: "DKK",
  DM: "XCD",
  DO: "DOP",
  DZ: "DZD",
  EC: "USD",
  EE: "EUR",
  EG: "EGP",
  ER: "ERN",
  ES: "EUR",
  ET: "ETB",
  FI: "EUR",
  FJ: "FJD",
  FM: "USD",
  FO: "DKK",
  FR: "EUR",
  GA: "XAF",
  GB: "GBP",
  GD: "XCD",
  GE: "GEL",
  GF: "EUR",
  GG: "GBP",
  GH: "GHS",
  GI: "GIP",
  GL: "DKK",
  GM: "GMD",
  GN: "GNF",
  GP: "EUR",
  GQ: "XAF",
  GR: "EUR",
  GT: "GTQ",
  GU: "USD",
  GW: "XOF",
  GY: "GYD",
  HK: "HKD",
  HN: "HNL",
  HR: "EUR",
  HT: "HTG",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IM: "GBP",
  IN: "INR",
  IQ: "IQD",
  IR: "IRR",
  IS: "ISK",
  IT: "EUR",
  JE: "GBP",
  JM: "JMD",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KG: "KGS",
  KH: "KHR",
  KI: "AUD",
  KM: "KMF",
  KN: "XCD",
  KR: "KRW",
  KW: "KWD",
  KY: "KYD",
  KZ: "KZT",
  LA: "LAK",
  LB: "LBP",
  LC: "XCD",
  LI: "CHF",
  LK: "LKR",
  LR: "LRD",
  LS: "LSL",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  LY: "LYD",
  MA: "MAD",
  MC: "EUR",
  MD: "MDL",
  ME: "EUR",
  MF: "EUR",
  MG: "MGA",
  MH: "USD",
  MK: "MKD",
  ML: "XOF",
  MM: "MMK",
  MN: "MNT",
  MO: "MOP",
  MP: "USD",
  MQ: "EUR",
  MR: "MRU",
  MS: "XCD",
  MT: "EUR",
  MU: "MUR",
  MV: "MVR",
  MW: "MWK",
  MX: "MXN",
  MY: "MYR",
  MZ: "MZN",
  NA: "NAD",
  NC: "XPF",
  NE: "XOF",
  NG: "NGN",
  NI: "NIO",
  NL: "EUR",
  NO: "NOK",
  NP: "NPR",
  NR: "AUD",
  NZ: "NZD",
  OM: "OMR",
  PA: "USD",
  PE: "PEN",
  PF: "XPF",
  PG: "PGK",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PM: "EUR",
  PR: "USD",
  PS: "ILS",
  PT: "EUR",
  PW: "USD",
  PY: "PYG",
  QA: "QAR",
  RE: "EUR",
  RO: "RON",
  RS: "RSD",
  RU: "RUB",
  RW: "RWF",
  SA: "SAR",
  SB: "SBD",
  SC: "SCR",
  SD: "SDG",
  SE: "SEK",
  SG: "SGD",
  SI: "EUR",
  SK: "EUR",
  SL: "SLE",
  SM: "EUR",
  SN: "XOF",
  SO: "SOS",
  SR: "SRD",
  SS: "SSP",
  ST: "STN",
  SV: "USD",
  SX: "ANG",
  SZ: "SZL",
  TC: "USD",
  TD: "XAF",
  TG: "XOF",
  TH: "THB",
  TJ: "TJS",
  TL: "USD",
  TM: "TMT",
  TN: "TND",
  TO: "TOP",
  TR: "TRY",
  TT: "TTD",
  TV: "AUD",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  UG: "UGX",
  US: "USD",
  UY: "UYU",
  UZ: "UZS",
  VA: "EUR",
  VC: "XCD",
  VE: "VES",
  VG: "USD",
  VI: "USD",
  VN: "VND",
  VU: "VUV",
  WS: "WST",
  XK: "EUR",
  YE: "YER",
  ZA: "ZAR",
  ZM: "ZMW",
  ZW: "ZWG",
};

export const CODIGOS_PAIS = Object.keys(MONEDA_DE_PAIS);

/** Los primeros de la lista: el mercado al que se vende hoy. */
export const PAISES_FRECUENTES = ["US", "PR", "MX", "CO", "VE", "DO", "ES", "CA", "PE", "CL", "AR", "EC"];

export interface Pais {
  codigo: string;
  nombre: string;
  moneda: string;
  bandera: string;
  frecuente: boolean;
}

/** La banderita sale del propio código del país (dos letras → dos símbolos). */
export function banderaDe(codigo: string): string {
  if (!/^[A-Za-z]{2}$/.test(codigo)) return "🏳️";
  return String.fromCodePoint(
    ...[...codigo.toUpperCase()].map((c) => 0x1f1e6 - 65 + (c.codePointAt(0) ?? 65)),
  );
}

function nombresDe(idioma: string, tipo: "region" | "currency"): (c: string) => string {
  try {
    const dn = new Intl.DisplayNames([idioma], { type: tipo });
    return (c) => dn.of(c) ?? c;
  } catch {
    return (c) => c;
  }
}

export function nombrePais(codigo: string, idioma: string): string {
  return nombresDe(idioma, "region")(codigo);
}

/** Todos los países, ordenados por su nombre en el idioma de la persona. */
export function listaPaises(idioma: string): Pais[] {
  const nombre = nombresDe(idioma, "region");
  const orden = new Intl.Collator(idioma);
  return CODIGOS_PAIS.map((codigo) => ({
    codigo,
    nombre: nombre(codigo),
    moneda: MONEDA_DE_PAIS[codigo] ?? "USD",
    bandera: banderaDe(codigo),
    frecuente: PAISES_FRECUENTES.includes(codigo),
  })).sort((a, b) => orden.compare(a.nombre, b.nombre));
}

/** Si el código no es un país conocido, el dólar: nunca se queda sin moneda. */
export function monedaDePais(codigo: string): string {
  return MONEDA_DE_PAIS[codigo.toUpperCase()] ?? "USD";
}

export interface Moneda {
  codigo: string;
  nombre: string;
}

/** Todas las monedas del mundo, con su nombre. Si el navegador no las trae, las de los países. */
export function listaMonedas(idioma: string): Moneda[] {
  const nombre = nombresDe(idioma, "currency");
  const codigos =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("currency")
      : [...new Set(Object.values(MONEDA_DE_PAIS))];
  const orden = new Intl.Collator(idioma);
  return codigos
    .map((codigo) => ({ codigo, nombre: nombre(codigo) }))
    .sort((a, b) => orden.compare(a.codigo, b.codigo));
}

/** Una moneda sirve si el navegador (o el servidor) sabe formatear dinero con ella. */
export function monedaValida(codigo: string): boolean {
  if (!/^[A-Z]{3}$/.test(codigo)) return false;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: codigo }).format(1);
    return true;
  } catch {
    return false;
  }
}

/**
 * Un país sirve si está en la lista de arriba. No vale preguntarle al sistema:
 * `Intl.DisplayNames` responde «Unknown Region» para códigos inventados como ZZ
 * y los daría por buenos.
 */
export function paisValido(codigo: string): boolean {
  return /^[A-Z]{2}$/.test(codigo) && CODIGOS_PAIS.includes(codigo);
}
