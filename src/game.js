import cards from '../cards.json' with { type: 'json' };

class Game {
  constructor(hostId) {
    this.players = [];
    this.hostId = hostId; // ID do jogador host
    // Criar objetos de carta com text property
    this.whiteDeck = cards.white.map(text => ({ text }));
    this.blackDeck = cards.black.map(text => ({ text }));
    this.playedCards = [];
    this.blackCard = null;
    this.cardCzarIndex = 0;
    this.started = false;
    this.phase = 'waiting'; // waiting, playing, judging, round_end
    this.roundWinner = null;
    this.winningCard = null;
    this.maxScore = 7;

    // Embaralhar os decks
    this.shuffleDeck(this.whiteDeck);
    this.shuffleDeck(this.blackDeck);
  }

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
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
        const card = this.whiteDeck.pop();
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

    // Pegar nova carta preta
    if (this.blackDeck.length === 0) {
      // Reembaralhar cartas pretas se acabarem
      this.blackDeck = cards.black.map(text => ({ text }));
      this.shuffleDeck(this.blackDeck);
    }
    this.blackCard = this.blackDeck.pop();

    this.phase = 'playing';
  }

  playCard(player, card) {
    // Verificar se não é o Card Czar
    if (this.getCardCzar().id === player.id) {
      throw new Error('Card Czar não pode jogar cartas');
    }

    // Verificar se já jogou
    if (this.playedCards.find(pc => pc.playerId === player.id)) {
      throw new Error('Você já jogou uma carta nesta rodada');
    }

    // Jogar a carta
    const playedCard = player.playCard(card);
    this.playedCards.push({
      playerId: player.id,
      card: playedCard
    });

    // Reabastecer a mão do jogador
    const newCard = this.whiteDeck.pop();
    if (newCard) {
      player.addCard(newCard);
    }

    // Verificar se todos jogaram (exceto o Card Czar)
    const nonCzarPlayers = this.players.length - 1;
    if (this.playedCards.length === nonCzarPlayers) {
      this.phase = 'judging';
      // Embaralhar as cartas jogadas para anonimizar
      this.shuffleDeck(this.playedCards);
    }
  }

  chooseWinner(cardText) {
    // Verificar se está na fase de julgamento
    if (this.phase !== 'judging') {
      throw new Error('Não é hora de escolher o vencedor');
    }

    // Encontrar a carta jogada
    const playedCard = this.playedCards.find(pc => pc.card.text === cardText);
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
    this.winningCard = playedCard.card;
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

  getCardCzar() {
    return this.players[this.cardCzarIndex];
  }

  getGameState() {
    return {
      started: this.started,
      phase: this.phase,
      hostId: this.hostId,
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
        ? this.playedCards.map(pc => ({ card: pc.card }))
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
