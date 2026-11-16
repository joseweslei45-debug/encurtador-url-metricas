const $ = (id) => document.getElementById(id);

async function carregarLinks() {
  const links = await (await fetch('/api/links')).json();
  $('vazio').hidden = links.length > 0;
  $('links').replaceChildren(
    ...links.map((link) => {
      const tr = document.createElement('tr');
      const codigo = document.createElement('td');
      const a = document.createElement('a');
      a.href = '/' + link.codigo;
      a.target = '_blank';
      a.textContent = '/' + link.codigo;
      codigo.append(a);

      const destino = document.createElement('td');
      destino.className = 'destino';
      destino.textContent = link.url;
      destino.title = link.url;

      const cliques = document.createElement('td');
      cliques.className = 'num';
      cliques.textContent = link.cliques;

      const acoes = document.createElement('td');
      const painel = document.createElement('a');
      painel.href = '/estatisticas.html?c=' + encodeURIComponent(link.codigo);
      painel.textContent = 'métricas →';
      acoes.append(painel);

      tr.append(codigo, destino, cliques, acoes);
      return tr;
    }),
  );
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('erro').hidden = true;
  const corpo = { url: $('url').value.trim() };
  if ($('alias').value.trim()) corpo.alias = $('alias').value.trim();
  if ($('expira').value) corpo.expiraEmDias = Number($('expira').value);

  const resposta = await fetch('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    $('erro').textContent = dados.erro;
    $('erro').hidden = false;
    return;
  }
  $('curta').textContent = dados.curta;
  $('painel').href = dados.painel;
  $('resultado').hidden = false;
  e.target.reset();
  carregarLinks();
});

$('copiar').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('curta').textContent);
  $('copiar').textContent = 'Copiado!';
  setTimeout(() => ($('copiar').textContent = 'Copiar'), 1500);
});

carregarLinks();
