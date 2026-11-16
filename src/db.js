import Database from 'better-sqlite3';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS links (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo     TEXT NOT NULL UNIQUE,
    url        TEXT NOT NULL,
    criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    expira_em  TEXT
  );

  CREATE TABLE IF NOT EXISTS cliques (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    criado_em   TEXT NOT NULL,
    dia         TEXT NOT NULL,
    hora        INTEGER NOT NULL,
    visitante   TEXT NOT NULL,
    pais        TEXT,
    navegador   TEXT,
    sistema     TEXT,
    dispositivo TEXT,
    origem      TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_cliques_link_dia ON cliques (link_id, dia);
`;

export function abrirBanco(arquivo = process.env.DB_FILE || 'encurtador.db') {
  const db = new Database(arquivo);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
