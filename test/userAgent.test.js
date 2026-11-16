import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analisarUserAgent, origem, paisAproximado } from '../src/userAgent.js';

const UA = {
  chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  whatsapp: 'WhatsApp/2.24.20.79 A',
};

describe('analisarUserAgent', () => {
  it('identifica navegador, sistema e dispositivo', () => {
    assert.deepEqual(analisarUserAgent(UA.chromeWindows), { navegador: 'Chrome', sistema: 'Windows', dispositivo: 'Desktop', bot: false });
    assert.deepEqual(analisarUserAgent(UA.safariIphone), { navegador: 'Safari', sistema: 'iOS', dispositivo: 'Celular', bot: false });
    assert.deepEqual(analisarUserAgent(UA.chromeAndroid), { navegador: 'Chrome', sistema: 'Android', dispositivo: 'Celular', bot: false });
    assert.equal(analisarUserAgent(UA.firefoxLinux).navegador, 'Firefox');
  });

  it('não confunde Edge com Chrome', () => {
    assert.equal(analisarUserAgent(UA.edge).navegador, 'Edge');
  });

  it('marca pré-visualizações e user-agent vazio como bot', () => {
    assert.equal(analisarUserAgent(UA.whatsapp).bot, true);
    assert.equal(analisarUserAgent('').bot, true);
  });
});

describe('paisAproximado', () => {
  it('prioriza o cabeçalho da CDN', () => {
    assert.equal(paisAproximado({ 'cf-ipcountry': 'br', 'accept-language': 'en-US' }), 'BR');
  });

  it('usa o idioma do navegador como fallback', () => {
    assert.equal(paisAproximado({ 'accept-language': 'pt-BR,pt;q=0.9' }), 'BR');
    assert.equal(paisAproximado({ 'accept-language': 'pt' }), 'Desconhecido');
  });
});

describe('origem', () => {
  it('extrai o domínio de quem indicou o link', () => {
    assert.equal(origem('https://www.instagram.com/p/123'), 'instagram.com');
    assert.equal(origem(undefined), 'Direto');
  });
});
