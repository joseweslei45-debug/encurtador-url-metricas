import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aliasValido, gerarCodigo, urlValida } from '../src/codigo.js';
import { partesLocais, ultimosDias } from '../src/tempo.js';

describe('gerarCodigo', () => {
  it('gera códigos base62 do tamanho pedido', () => {
    const codigo = gerarCodigo(9);
    assert.match(codigo, /^[A-Za-z0-9]{9}$/);
  });

  it('praticamente não repete', () => {
    const codigos = new Set(Array.from({ length: 1000 }, () => gerarCodigo()));
    assert.equal(codigos.size, 1000);
  });
});

describe('validações', () => {
  it('aceita apenas URLs http(s)', () => {
    assert.ok(urlValida('https://github.com'));
    assert.ok(!urlValida('javascript:alert(1)'));
    assert.ok(!urlValida('ftp://x.com'));
    assert.ok(!urlValida('nao é url'));
  });

  it('valida alias e bloqueia palavras reservadas', () => {
    assert.ok(aliasValido('meu-portfolio'));
    assert.ok(!aliasValido('ab'));
    assert.ok(!aliasValido('com espaço'));
    assert.ok(!aliasValido('api'));
  });
});

describe('tempo', () => {
  it('converte para o fuso de São Paulo', () => {
    assert.deepEqual(partesLocais(new Date('2026-11-16T02:30:00Z'), 'America/Sao_Paulo'), { dia: '2026-11-15', hora: 23 });
  });

  it('lista os últimos dias atravessando o mês', () => {
    assert.deepEqual(ultimosDias('2026-12-02', 3), ['2026-11-30', '2026-12-01', '2026-12-02']);
  });
});
