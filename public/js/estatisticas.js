const $ = (id) => document.getElementById(id);
const codigo = new URLSearchParams(location.search).get('c');
const CORES = ['#8b5cf6', '#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#f87171', '#22d3ee', '#a3e635', '#fb923c', '#94a3b8'];
const graficos = {};

Chart.defaults.color = '#8a93a6';
Chart.defaults.borderColor = '#262c3a';
Chart.defaults.maintainAspectRatio = false;

function desenhar(id, config) {
  if (graficos[id]) {
    graficos[id].data = config.data;
    graficos[id].update('none');
  } else {
    graficos[id] = new Chart($(id), config);
  }
}

function pizza(id, linhas) {
  desenhar(id, {
    type: 'doughnut',
    data: {
      labels: linhas.map((l) => l.chave),
      datasets: [{ data: linhas.map((l) => l.total), backgroundColor: CORES, borderWidth: 0 }],
    },
    options: { cutout: '60%', plugins: { legend: { position: 'right' } } },
  });
}

async function atualizar() {
  const resposta = await fetch('/api/links/' + encodeURIComponent(codigo) + '/estatisticas');
  if (!resposta.ok) {
    $('titulo').textContent = 'Link não encontrado';
    return;
  }
  const s = await resposta.json();

  $('titulo').textContent = '/' + s.link.codigo;
  $('destino').textContent = '→ ' + s.link.url;
  $('k-total').textContent = s.total;
  $('k-unicos').textContent = s.visitantesUnicos;
  $('k-pais').textContent = s.pais[0] ? s.pais[0].chave : '-';
  $('k-origem').textContent = s.origem[0] ? s.origem[0].chave : '-';

  desenhar('g-dias', {
    type: 'line',
    data: {
      labels: s.porDia.map((d) => d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7)),
      datasets: [{
        label: 'Cliques',
        data: s.porDia.map((d) => d.total),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,.2)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });

  desenhar('g-horas', {
    type: 'bar',
    data: {
      labels: s.porHora.map((_, h) => String(h).padStart(2, '0') + 'h'),
      datasets: [{ label: 'Cliques', data: s.porHora, backgroundColor: '#34d399', borderRadius: 4 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });

  pizza('g-navegador', s.navegador);
  pizza('g-sistema', s.sistema);
  pizza('g-dispositivo', s.dispositivo);
  pizza('g-pais', s.pais);
}

if (!codigo) {
  $('titulo').textContent = 'Informe um link: /estatisticas.html?c=codigo';
} else {
  atualizar();
  setInterval(atualizar, 10_000);
}
