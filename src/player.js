import cuid from 'cuid';

class Player {
  constructor(name) {
    this.id = cuid();
    this.name = name;
    this.hand = [];
  }

  addCard(card) {
    this.hand.push(card);
  }

  playCard(card) {
    const cardIndex = this.hand.indexOf(card);
    if (cardIndex > -1) {
      this.hand.splice(cardIndex, 1);
    }
    return card;
  }
}

export default Player;