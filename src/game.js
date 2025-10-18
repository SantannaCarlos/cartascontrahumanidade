import cuid from 'cuid';
import cards from '../cards.json';

class Game {
  constructor() {
    this.code = cuid.slug();
    this.players = [];
    this.cards = cards;
    this.playedCards = [];
    this.blackCard = null;
    this.cardCzar = null;
    this.started = false;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(player) {
    this.players = this.players.filter(p => p.id !== player.id);
  }

  start() {
    this.started = true;
    this.dealCards();
    this.nextRound();
  }

  dealCards() {
    this.players.forEach(player => {
      while (player.hand.length < 10) {
        player.addCard(this.cards.white.pop());
      }
    });
  }

  nextRound() {
    this.blackCard = this.cards.black.pop();
    this.cardCzar = this.players[0];
  }

  playCard(player, card) {
    this.playedCards.push({ player, card });
  }

  chooseWinner(votes) {
    const voteCount = votes.reduce((acc, player) => {
      acc[player.id] = (acc[player.id] || 0) + 1;
      return acc;
    }, {});

    const winnerId = Object.keys(voteCount).reduce((a, b) => voteCount[a] > voteCount[b] ? a : b);
    return this.players.find(p => p.id === winnerId);
  }
}

export default Game;
