import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { criarApp } from '../src/app.js';
import { abrirBanco } from '../src/db.js';

const NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
let servidor;
let base;

before(async () => {
  const app = criarApp(abrirBanco(':memory:'), { salt: 'teste' });
  await new Promise((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = 'http://127.0.0.1:' + servidor.address().port;
});

after(() => servidor.close());

const criar = (corpo) =>
  fetch(base + '/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  });

const visitar = (codigo, headers = {}) =>
  fetch(base + '/' + codigo, { redirect: 'manual', headers: { 'user-agent': NAVEGADOR, ...headers } });

describe('API do encurtador', () => {
  it('cria um link curto e redireciona com 302', async () => {
    const resposta = await criar({ url: 'https://github.com/joseweslei45-debug' });
    assert.equal(resposta.status, 201);
    const link = await resposta.json();
    assert.match(link.codigo, /^[A-Za-z0-9]{7}$/);

    const visita = await visitar(link.codigo);
    assert.equal(visita.status, 302);
    assert.equal(visita.headers.get('location'), 'https://github.com/joseweslei45-debug');
  });

  it('registra métricas e ignora robôs de pré-visualização', async () => {
    await criar({ url: 'https://example.com', alias: 'meu-link' });
    await visitar('meu-link', { referer: 'https://www.instagram.com/', 'accept-language': 'pt-BR' });
    await visitar('meu-link');
    await visitar('meu-link', { 'user-agent': 'WhatsApp/2.24.20.79 A' });

    const stats = await (await fetch(base + '/api/links/meu-link/estatisticas')).json();
    assert.equal(stats.total, 2);
    assert.equal(stats.visitantesUnicos, 1);
    assert.deepEqual(stats.navegador, [{ chave: 'Chrome', total: 2 }]);
    assert.ok(stats.origem.some((o) => o.chave === 'instagram.com'));
    assert.equal(stats.porDia.length, 30);
    assert.equal(stats.porHora.reduce((a, b) => a + b, 0), 2);
  });

  it('valida a URL e impede alias duplicado', async () => {
    assert.equal((await criar({ url: 'javascript:alert(1)' })).status, 400);
    assert.equal((await criar({ url: 'https://a.com', alias: 'repetido' })).status, 201);
    assert.equal((await criar({ url: 'https://b.com', alias: 'repetido' })).status, 409);
  });

  it('responde 404 para códigos inexistentes', async () => {
    assert.equal((await visitar('nao-existe')).status, 404);
  });
});
