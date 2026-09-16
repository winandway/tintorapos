/**
 * Fechas con zona horaria de la tienda. Se guarda todo en milisegundos UTC y
 * la «fecha local» (AAAA-MM-DD) se calcula con la zona de la tintorería.
 */

function partes(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const p: Record<string, string> = {};
  for (const { type, value } of f.formatToParts(new Date(instante))) p[type] = value;
  return p;
}

export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/** AAAA-MM-DD en la zona de la tienda. */
export function fechaLocal(instante: number, zona: string): string {
  const p = partes(instante, zona);
  return `${p.year}-${p.month}-${p.day}`;
}

const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Día de la semana en la zona de la tienda (0 = domingo). Da el color del ticket. */
export function diaSemana(instante: number, zona: string): number {
  return DIAS[partes(instante, zona).weekday ?? "Sun"] ?? 0;
}

/** Desfase de la zona respecto de UTC en ese instante, en milisegundos. */
function desfase(instante: number, zona: string): number {
  const p = partes(instante, zona);
  const comoUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return comoUtc - Math.floor(instante / 1000) * 1000;
}

/** Instante UTC de una hora local concreta (AAAA-MM-DD hh:mm) en la zona. */
export function instanteLocal(fecha: string, hora: number, minuto: number, zona: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const ingenuo = Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1, hora, minuto);
  // Dos pasadas resuelven los cambios de horario de verano.
  let t = ingenuo - desfase(ingenuo, zona);
  t = ingenuo - desfase(t, zona);
  return t;
}

export function sumarDiasFecha(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, (d ?? 1) + dias));
  return t.toISOString().slice(0, 10);
}

/** Rango [inicio, fin) en UTC del día local indicado. */
export function rangoDia(fecha: string, zona: string): [number, number] {
  return [instanteLocal(fecha, 0, 0, zona), instanteLocal(sumarDiasFecha(fecha, 1), 0, 0, zona)];
}

/**
 * Fecha promesa por defecto: dentro de N días (saltando domingos) a las 5:00 p. m.
 * hora de la tienda. Si es urgente, el mismo día a las 5:00 p. m. o, si ya pasó,
 * el día siguiente.
 */
export function fechaPromesa(ahora: number, zona: string, dias: number, urgente: boolean): number {
  let fecha = fechaLocal(ahora, zona);
  if (urgente) {
    const hoyCinco = instanteLocal(fecha, 17, 0, zona);
    if (ahora < hoyCinco - 60 * 60 * 1000) return hoyCinco;
    fecha = sumarDiasFecha(fecha, 1);
  } else {
    let restantes = Math.max(0, dias);
    while (restantes > 0) {
      fecha = sumarDiasFecha(fecha, 1);
      const [a, m, d] = fecha.split("-").map(Number);
      if (new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay() !== 0) restantes--;
    }
  }
  const [a, m, d] = fecha.split("-").map(Number);
  if (new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay() === 0) fecha = sumarDiasFecha(fecha, 1);
  return instanteLocal(fecha, 17, 0, zona);
}

export const MS_DIA = 24 * 60 * 60 * 1000;
