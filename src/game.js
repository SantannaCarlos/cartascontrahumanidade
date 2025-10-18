import cuid from 'cuid';

class Game {
  constructor() {
    this.code = cuid.slug();
    this.players = [];
    this.cards = { white: [], black: [] };
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

  chooseWinner(card) {
    const winner = this.playedCards.find(c => c.card === card).player;
    return winner;
  }
}

export default Game;
