# 🃏 Cartas Contra a Humanidade

Um jogo de festa multiplayer online para pessoas horríveis! Versão brasileira do famoso Cards Against Humanity. - Online

Um jogo multiplayer online inspirado em Cards Against Humanity, criado com Node.js, Express e Socket.io.

## 🎮 Como Jogar

1. Acesse o jogo no navegador
2. Digite seu nome
3. Crie uma sala ou entre em uma sala existente com o código
4. Aguarde pelo menos 3 jogadores
5. O criador da sala inicia o jogo
6. A cada rodada:
   - Um jogador é o **Card Czar** (juiz)
   - Uma **carta preta** é revelada com uma pergunta ou frase
   - Os outros jogadores escolhem uma **carta branca** da mão para responder
   - O Card Czar escolhe a melhor resposta
   - O jogador com a carta escolhida ganha 1 ponto
7. O primeiro a atingir a pontuação escolhida pelo Host vence

## 🚀 Executar Localmente

### Pré-requisitos
- Node.js 18+ instalado

### Instalação

```bash
npm install
```

### Iniciar o servidor

```bash
npm start
```

O jogo estará disponível em `http://localhost:3000`

## 📦 Deploy

### Opção 1: Render (Recomendado - Gratuito)

1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo **Web Service**
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment**: Node
5. Clique em "Create Web Service"

## 🎴 Cartas

O jogo usa cartas em português brasileiro incluídas no arquivo `cards.json`.

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla

## 📝 Estrutura do Projeto

```
/
├── public/          # Frontend (HTML, CSS, JS)
├── src/             # Backend
│   ├── server.js    # Servidor principal
│   ├── game.js      # Lógica do jogo
│   └── player.js    # Lógica do jogador
├── cards.json       # Cartas do jogo
└── package.json     # Dependências
```

## 🎯 Funcionalidades

- ✅ Criação de salas privadas
- ✅ Suporte para múltiplos jogadores
- ✅ Sistema de pontuação
- ✅ Rotação automática do Card Czar
- ✅ Reabastecimento automático das cartas
- ✅ Interface responsiva
- ✅ Notificações em tempo real

## 📄 Licença

Este é um projeto educacional e recreativo. As cartas são de domínio público.
