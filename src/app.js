import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { aliasValido, gerarCodigo, urlValida } from './codigo.js';
import { limitador } from './limitador.js';
import { criarRepositorio } from './repositorio.js';
import { partesLocais } from './tempo.js';
import { analisarUserAgent, origem, paisAproximado } from './userAgent.js';

const PUBLICO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function criarApp(db, opcoes = {}) {
  const fuso = opcoes.fuso || process.env.FUSO_HORARIO || 'America/Sao_Paulo';
  const salt = opcoes.salt || process.env.HASH_SALT || crypto.randomBytes(16).toString('hex');
  const repo = criarRepositorio(db);
  const app = express();

  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(PUBLICO));

  const urlBase = (req) => process.env.BASE_URL || req.protocol + '://' + req.get('host');

  // ---------- API ----------
  app.post('/api/links', limitador(opcoes.limite), (req, res) => {
    const { url, alias, expiraEmDias } = req.body || {};

    if (!urlValida(url)) {
      return res.status(400).json({ erro: 'Informe uma URL válida começando com http:// ou https://' });
    }
    if (alias && !aliasValido(alias)) {
      return res.status(400).json({ erro: 'O alias deve ter de 3 a 32 caracteres: letras, números, - ou _' });
    }
    const dias = expiraEmDias ? Number(expiraEmDias) : null;
    if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 365)) {
      return res.status(400).json({ erro: 'A expiração deve ser entre 1 e 365 dias' });
    }
    if (alias && repo.buscarPorCodigo(alias)) {
      return res.status(409).json({ erro: 'Esse alias já está em uso' });
    }

    let codigo = alias || gerarCodigo();
    while (!alias && repo.buscarPorCodigo(codigo)) codigo = gerarCodigo();

    const expiraEm = dias ? new Date(Date.now() + dias * 86_400_000).toISOString() : null;
    const link = repo.criarLink(codigo, url, expiraEm);
    const base = urlBase(req);

    res.status(201).json({
      ...link,
      curta: base + '/' + codigo,
      painel: base + '/estatisticas.html?c=' + codigo,
    });
  });

  app.get('/api/links', (req, res) => {
    res.json(repo.listarRecentes(50));
  });

  app.get('/api/links/:codigo/estatisticas', (req, res) => {
    const link = repo.buscarPorCodigo(req.params.codigo);
    if (!link) return res.status(404).json({ erro: 'Link não encontrado' });
    const { dia } = partesLocais(new Date(), fuso);
    res.json({ link, ...repo.estatisticas(link.id, dia) });
  });

  // ---------- Redirecionamento ----------
  app.get('/:codigo', (req, res, next) => {
    const { codigo } = req.params;
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(codigo)) return next();

    const link = repo.buscarPorCodigo(codigo);
    if (!link) return res.status(404).sendFile(path.join(PUBLICO, '404.html'));
    if (link.expira_em && new Date(link.expira_em) < new Date()) {
      return res.status(410).sendFile(path.join(PUBLICO, '404.html'));
    }

    const userAgent = req.get('user-agent') || '';
    const ua = analisarUserAgent(userAgent);
    if (!ua.bot) {
      const agora = new Date();
      const { dia, hora } = partesLocais(agora, fuso);
      repo.registrarClique({
        linkId: link.id,
        criadoEm: agora.toISOString(),
        dia,
        hora,
        // O IP nunca é salvo: guardamos só um hash para contar visitantes únicos.
        visitante: crypto.createHash('sha256').update(salt + req.ip + userAgent).digest('hex').slice(0, 16),
        pais: paisAproximado(req.headers),
        navegador: ua.navegador,
        sistema: ua.sistema,
        dispositivo: ua.dispositivo,
        origem: origem(req.get('referer')),
      });
    }

    // 302 (e não 301) para o navegador não guardar em cache e todo clique ser contado.
    res.set('Cache-Control', 'no-store');
    res.redirect(302, link.url);
  });

  return app;
}
