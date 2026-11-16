import { criarApp } from './app.js';
import { abrirBanco } from './db.js';

const porta = Number(process.env.PORT || 3000);
const app = criarApp(abrirBanco());

app.listen(porta, () => {
  console.log('Encurtador rodando em http://localhost:' + porta);
});
