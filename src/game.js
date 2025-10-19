import cards from '../cards.json' with { type: 'json' };

class Game {
  constructor(hostId) {
    this.players = [];
    this.hostId = hostId; // ID do jogador host
    // Criar objetos de carta com text property
    this.whiteDeck = cards.white.map(text => ({ text }));
    this.blackDeck = cards.black.map(text => ({ text }));
    this.whiteDiscard = []; // Pilha de descarte para cartas brancas
    this.blackDiscard = []; // Pilha de descarte para cartas pretas
    this.playedCards = [];
    this.blackCard = null;
    this.cardCzarIndex = 0;
    this.started = false;
    this.phase = 'waiting'; // waiting, playing, judging, round_end
    this.roundWinner = null;
    this.winningCard = null;
    this.maxScore = 7;
    this.roundTimer = null; // Timer para timeouts
    this.playTimeout = 60000; // 1 minuto para jogar
    this.judgeTimeout = 180000; // 3 minutos para julgar

    // Embaralhar os decks
    this.shuffleDeck(this.whiteDeck);
    this.shuffleDeck(this.blackDeck);
  }

  // Conta quantas cartas brancas são necessárias (conta ___ na carta preta)
  getPickCount(blackCardText) {
    const matches = blackCardText.match(/____/g);
    return matches ? matches.length : 1;
  }

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  // Puxar carta branca do deck (com reembaralhamento automático)
  drawWhiteCard() {
    if (this.whiteDeck.length === 0) {
      // Se o deck acabou, reembaralhar o descarte
      if (this.whiteDiscard.length === 0) {
        console.error('Não há mais cartas brancas disponíveis!');
        return null;
      }
      console.log(`Reembaralhando ${this.whiteDiscard.length} cartas brancas do descarte`);
      this.whiteDeck = [...this.whiteDiscard];
      this.whiteDiscard = [];
      this.shuffleDeck(this.whiteDeck);
    }
    return this.whiteDeck.pop();
  }

  // Puxar carta preta do deck (com reembaralhamento automático)
  drawBlackCard() {
    if (this.blackDeck.length === 0) {
      // Se o deck acabou, reembaralhar o descarte
      if (this.blackDiscard.length === 0) {
        console.error('Não há mais cartas pretas disponíveis!');
        return null;
      }
      console.log(`Reembaralhando ${this.blackDiscard.length} cartas pretas do descarte`);
      this.blackDeck = [...this.blackDiscard];
      this.blackDiscard = [];
      this.shuffleDeck(this.blackDeck);
    }
    return this.blackDeck.pop();
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(player) {
    const playerIndex = this.players.findIndex(p => p.id === player.id);
    if (playerIndex > -1) {
      this.players.splice(playerIndex, 1);

      // Se o host foi removido, transferir para o próximo jogador
      if (player.id === this.hostId && this.players.length > 0) {
        this.hostId = this.players[0].id;
      }

      // Ajustar o cardCzarIndex se necessário
      if (this.started && this.players.length > 0) {
        if (playerIndex <= this.cardCzarIndex) {
          this.cardCzarIndex = Math.max(0, this.cardCzarIndex - 1);
        }
        if (this.cardCzarIndex >= this.players.length) {
          this.cardCzarIndex = 0;
        }
      }
    }
  }

  isHost(playerId) {
    return playerId === this.hostId;
  }

  kickPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player && playerId !== this.hostId) {
      this.removePlayer(player);
      return true;
    }
    return false;
  }

  setMaxScore(maxScore) {
    if (maxScore && maxScore > 0) {
      this.maxScore = maxScore;
    }
  }

  startGame() {
    if (this.players.length < 3) {
      throw new Error('Precisa de pelo menos 3 jogadores para começar');
    }

    this.started = true;
    this.cardCzarIndex = 0;
    this.dealInitialCards();
    this.nextRound();
  }

  dealInitialCards() {
    this.players.forEach(player => {
      while (player.hand.length < 10) {
        const card = this.drawWhiteCard();
        if (card) {
          player.addCard(card);
        }
      }
    });
  }

  nextRound() {
    this.playedCards = [];
    this.roundWinner = null;
    this.winningCard = null;

    // Limpar timer anterior se existir
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    // Adicionar carta preta anterior ao descarte
    if (this.blackCard) {
      this.blackDiscard.push(this.blackCard);
    }

    // Pegar nova carta preta usando o sistema de deck
    this.blackCard = this.drawBlackCard();

    this.phase = 'playing';

    // Iniciar timer de 1 minuto para jogadores escolherem
    this.roundTimer = setTimeout(() => {
      this.handlePlayTimeout();
    }, this.playTimeout);
  }

  handlePlayTimeout() {
    // Se ainda estiver na fase de jogar, forçar avançar para julgamento
    if (this.phase === 'playing' && this.playedCards.length > 0) {
      this.phase = 'judging';
      this.shuffleDeck(this.playedCards);
      
      // Iniciar timer de 3 minutos para czar julgar
      this.roundTimer = setTimeout(() => {
        this.handleJudgeTimeout();
      }, this.judgeTimeout);
    } else if (this.phase === 'playing' && this.playedCards.length === 0) {
      // Ninguém jogou, pular rodada
      this.continueToNextRound();
    }
  }

  handleJudgeTimeout() {
    // Se ainda estiver na fase de julgamento, escolher aleatoriamente
    if (this.phase === 'judging' && this.playedCards.length > 0) {
      const randomCard = this.playedCards[Math.floor(Math.random() * this.playedCards.length)];
      const winner = this.players.find(p => p.id === randomCard.playerId);
      if (winner) {
        winner.addScore();
        this.roundWinner = winner;
        this.winningCard = randomCard.cards;
        this.phase = 'round_end';
      }
    }
  }

  playCard(player, cardsToPlay) {
    // Verificar se não é o Card Czar
    if (this.getCardCzar().id === player.id) {
      throw new Error('Card Czar não pode jogar cartas');
    }

    // Verificar se já jogou
    if (this.playedCards.find(pc => pc.playerId === player.id)) {
      throw new Error('Você já jogou uma carta nesta rodada');
    }

    // Converter para array se não for
    const cards = Array.isArray(cardsToPlay) ? cardsToPlay : [cardsToPlay];

    // Verificar quantidade correta de cartas
    const pickCount = this.getPickCount(this.blackCard.text);
    if (cards.length !== pickCount) {
      throw new Error(`Você precisa jogar exatamente ${pickCount} carta(s)`);
    }

    // Jogar as cartas
    const playedCards = [];
    for (const card of cards) {
      const playedCard = player.playCard(card);
      playedCards.push(playedCard);
      // Adicionar carta ao descarte
      this.whiteDiscard.push(playedCard);
    }

    this.playedCards.push({
      playerId: player.id,
      cards: playedCards
    });

    // Reabastecer a mão do jogador (mesma quantidade que jogou)
    for (let i = 0; i < cards.length; i++) {
      const newCard = this.drawWhiteCard();
      if (newCard) {
        player.addCard(newCard);
      }
    }

    // Verificar se todos jogaram (exceto o Card Czar)
    const nonCzarPlayers = this.players.filter(p => p.id !== this.getCardCzar().id).length;
    if (this.playedCards.length === nonCzarPlayers) {
      // Todos jogaram, cancelar timer e ir para julgamento
      if (this.roundTimer) {
        clearTimeout(this.roundTimer);
      }
      this.phase = 'judging';
      // Embaralhar as cartas jogadas para anonimizar
      this.shuffleDeck(this.playedCards);
      
      // Iniciar timer de 3 minutos para czar julgar
      this.roundTimer = setTimeout(() => {
        this.handleJudgeTimeout();
      }, this.judgeTimeout);
    }
  }

  chooseWinner(cardsIdentifier) {
    // Verificar se está na fase de julgamento
    if (this.phase !== 'judging') {
      throw new Error('Não é hora de escolher o vencedor');
    }

    // Limpar timer de julgamento
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }

    // Encontrar a carta jogada (pode ser uma ou múltiplas)
    const playedCard = this.playedCards.find(pc => {
      const cardsText = Array.isArray(pc.cards) 
        ? pc.cards.map(c => c.text).join('|')
        : pc.cards.text;
      return cardsText === cardsIdentifier;
    });

    if (!playedCard) {
      throw new Error('Carta não encontrada');
    }

    // Encontrar o jogador vencedor
    const winner = this.players.find(p => p.id === playedCard.playerId);
    if (!winner) {
      throw new Error('Jogador não encontrado');
    }

    // Adicionar ponto
    winner.addScore();

    this.roundWinner = winner;
    this.winningCard = playedCard.cards;
    this.phase = 'round_end';

    // Verificar se alguém ganhou o jogo
    if (winner.score >= this.maxScore) {
      this.phase = 'game_end';
      return { winner, gameEnded: true };
    }

    return { winner, gameEnded: false };
  }

  continueToNextRound() {
    // Passar o Card Czar para o próximo jogador
    this.cardCzarIndex = (this.cardCzarIndex + 1) % this.players.length;
    this.nextRound();
  }

  restartGame() {
    // Resetar pontuações
    this.players.forEach(p => p.score = 0);
    
    // Resetar estado do jogo
    this.started = true;
    this.phase = 'playing';
    this.cardCzarIndex = 0;
    this.roundWinner = null;
    this.winningCard = null;
    
    // Embaralhar decks novamente
    this.whiteDeck = cards.white.map(text => ({ text }));
    this.blackDeck = cards.black.map(text => ({ text }));
    this.shuffleDeck(this.whiteDeck);
    this.shuffleDeck(this.blackDeck);
    
    // Redealar cartas
    this.dealInitialCards();
    this.nextRound();
  }

  addLatePlayer(player) {
    // Adicionar jogador mesmo com jogo em andamento
    this.players.push(player);
    
    // Dar 10 cartas ao jogador usando o sistema de deck
    while (player.hand.length < 10) {
      const card = this.drawWhiteCard();
      if (card) {
        player.addCard(card);
      }
    }
  }

  getCardCzar() {
    return this.players[this.cardCzarIndex];
  }

  getGameState() {
    const pickCount = this.blackCard ? this.getPickCount(this.blackCard.text) : 1;
    
    return {
      started: this.started,
      phase: this.phase,
      hostId: this.hostId,
      pickCount: pickCount,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        handCount: p.hand.length,
        isHost: p.id === this.hostId
      })),
      blackCard: this.blackCard,
      cardCzar: this.getCardCzar() ? {
        id: this.getCardCzar().id,
        name: this.getCardCzar().name
      } : null,
      playedCardsCount: this.playedCards.length,
      playedCards: this.phase === 'judging' || this.phase === 'round_end' || this.phase === 'game_end'
        ? this.playedCards.map(pc => ({ cards: pc.cards }))
        : [],
      roundWinner: this.roundWinner ? {
        id: this.roundWinner.id,
        name: this.roundWinner.name,
        score: this.roundWinner.score
      } : null,
      winningCard: this.winningCard,
      maxScore: this.maxScore
    };
  }
}

export default Game;
