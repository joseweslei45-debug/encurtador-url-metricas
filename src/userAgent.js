const NAVEGADORES = [
  ['Edge', /Edg(e|A|iOS)?\//],
  ['Opera', /OPR\/|Opera/],
  ['Samsung Internet', /SamsungBrowser\//],
  ['Chrome', /(Chrome|CriOS)\//],
  ['Firefox', /(Firefox|FxiOS)\//],
  ['Safari', /Version\/.*Safari\//],
];

const SISTEMAS = [
  ['Windows', /Windows NT/],
  ['Android', /Android/],
  ['iOS', /iPhone|iPad|iPod/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Mac OS X|Macintosh/],
  ['Linux', /Linux/],
];

/** Pré-visualizações de link (WhatsApp, Telegram...) e robôs não contam como clique. */
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|preview|curl|wget/i;

const primeiro = (lista, ua) => (lista.find(([, regex]) => regex.test(ua)) || ['Outro'])[0];

export function analisarUserAgent(ua = '') {
  let dispositivo = 'Desktop';
  if (/iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobi/.test(ua))) dispositivo = 'Tablet';
  else if (/Mobi|iPhone/.test(ua)) dispositivo = 'Celular';

  return {
    navegador: primeiro(NAVEGADORES, ua),
    sistema: primeiro(SISTEMAS, ua),
    dispositivo,
    bot: !ua || BOTS.test(ua),
  };
}

/** País aproximado: cabeçalho de CDN (Cloudflare/Vercel) ou, na falta dele, o idioma do navegador. */
export function paisAproximado(headers = {}) {
  const cdn = headers['cf-ipcountry'] || headers['x-vercel-ip-country'];
  if (cdn && /^[A-Z]{2}$/i.test(cdn) && cdn.toUpperCase() !== 'XX') return cdn.toUpperCase();
  const idioma = String(headers['accept-language'] || '').split(',')[0].trim();
  const m = idioma.match(/^[a-z]{2,3}-([a-z]{2})$/i);
  return m ? m[1].toUpperCase() : 'Desconhecido';
}

export function origem(referer) {
  if (!referer) return 'Direto';
  try {
    return new URL(referer).hostname.replace(/^www\./, '');
  } catch {
    return 'Desconhecido';
  }
}
