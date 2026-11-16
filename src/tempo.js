/** Dia (AAAA-MM-DD) e hora (0-23) de um instante em um fuso horário. */
export function partesLocais(data, timeZone) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { dia: p.year + '-' + p.month + '-' + p.day, hora: Number(p.hour) };
}

/** Lista os últimos n dias terminando em "hoje" (inclusive). */
export function ultimosDias(hoje, n) {
  const [a, m, d] = hoje.split('-').map(Number);
  const base = Date.UTC(a, m - 1, d);
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
