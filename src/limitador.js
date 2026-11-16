/** Rate limit simples em memória (janela deslizante por IP). */
export function limitador({ janelaMs = 60_000, maximo = 20 } = {}) {
  const acessos = new Map();
  return (req, res, next) => {
    const agora = Date.now();
    const recentes = (acessos.get(req.ip) || []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= maximo) {
      res.set('Retry-After', String(Math.ceil(janelaMs / 1000)));
      return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em instantes.' });
    }
    recentes.push(agora);
    acessos.set(req.ip, recentes);
    next();
  };
}
