import crypto from 'node:crypto';

const ALFABETO = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RESERVADOS = new Set(['api', 'estatisticas', 'index', 'admin', 'css', 'js']);

/** Código aleatório em base62 usando gerador criptograficamente seguro. */
export function gerarCodigo(tamanho = 7) {
  let codigo = '';
  for (let i = 0; i < tamanho; i++) codigo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return codigo;
}

export function aliasValido(alias) {
  return typeof alias === 'string' && /^[A-Za-z0-9_-]{3,32}$/.test(alias) && !RESERVADOS.has(alias.toLowerCase());
}

export function urlValida(valor) {
  if (typeof valor !== 'string' || valor.length > 2048) return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
