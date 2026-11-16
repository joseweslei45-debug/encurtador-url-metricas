import { ultimosDias } from './tempo.js';

const COLUNAS_AGRUPAVEIS = ['navegador', 'sistema', 'dispositivo', 'pais', 'origem'];

export function criarRepositorio(db) {
  const sql = {
    inserirLink: db.prepare('INSERT INTO links (codigo, url, expira_em) VALUES (?, ?, ?)'),
    porCodigo: db.prepare('SELECT * FROM links WHERE codigo = ?'),
    recentes: db.prepare(`
      SELECT l.*, (SELECT COUNT(*) FROM cliques c WHERE c.link_id = l.id) AS cliques
      FROM links l ORDER BY l.id DESC LIMIT ?`),
    inserirClique: db.prepare(`
      INSERT INTO cliques (link_id, criado_em, dia, hora, visitante, pais, navegador, sistema, dispositivo, origem)
      VALUES (@linkId, @criadoEm, @dia, @hora, @visitante, @pais, @navegador, @sistema, @dispositivo, @origem)`),
    totais: db.prepare('SELECT COUNT(*) AS total, COUNT(DISTINCT visitante) AS unicos FROM cliques WHERE link_id = ?'),
    porHora: db.prepare('SELECT hora, COUNT(*) AS total FROM cliques WHERE link_id = ? GROUP BY hora'),
    porDia: db.prepare('SELECT dia, COUNT(*) AS total FROM cliques WHERE link_id = ? AND dia >= ? GROUP BY dia'),
  };

  // As colunas vêm de uma lista fixa, então montar o SQL aqui é seguro.
  const agrupamentos = Object.fromEntries(
    COLUNAS_AGRUPAVEIS.map((coluna) => [
      coluna,
      db.prepare(
        'SELECT ' + coluna + ' AS chave, COUNT(*) AS total FROM cliques WHERE link_id = ? ' +
          'GROUP BY ' + coluna + ' ORDER BY total DESC LIMIT 10',
      ),
    ]),
  );

  return {
    criarLink(codigo, url, expiraEm = null) {
      sql.inserirLink.run(codigo, url, expiraEm);
      return sql.porCodigo.get(codigo);
    },

    buscarPorCodigo: (codigo) => sql.porCodigo.get(codigo),

    listarRecentes: (limite = 50) => sql.recentes.all(limite),

    registrarClique: (dados) => sql.inserirClique.run(dados),

    estatisticas(linkId, hoje, dias = 30) {
      const { total, unicos } = sql.totais.get(linkId);

      const porHora = Array(24).fill(0);
      for (const r of sql.porHora.all(linkId)) porHora[r.hora] = r.total;

      const periodo = ultimosDias(hoje, dias);
      const contagem = new Map(sql.porDia.all(linkId, periodo[0]).map((r) => [r.dia, r.total]));

      const resultado = {
        total,
        visitantesUnicos: unicos,
        porDia: periodo.map((dia) => ({ dia, total: contagem.get(dia) || 0 })),
        porHora,
      };
      for (const coluna of COLUNAS_AGRUPAVEIS) resultado[coluna] = agrupamentos[coluna].all(linkId);
      return resultado;
    },
  };
}
