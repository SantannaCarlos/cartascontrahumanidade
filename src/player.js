class Player {
  constructor(name, socketId) {
    this.id = socketId;
    this.name = name;
    this.hand = [];
    this.score = 0;
  }

  addCard(card) {
    this.hand.push(card);
  }

  playCard(card) {
    const cardIndex = this.hand.findIndex(c => c.text === card.text);
    if (cardIndex > -1) {
      this.hand.splice(cardIndex, 1);
    }
    return card;
  }

  addScore() {
    this.score++;
  }
}

export default Player;