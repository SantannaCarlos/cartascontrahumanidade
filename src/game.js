const cards = require('../cards.json');

class Game {
    constructor(host) {
        this.host = host;
        this.players = [host];
        this.whiteCards = [...cards.whiteCards];
        this.blackCards = [...cards.blackCards];
        this.playedWhiteCards = [];
        this.playedBlackCards = [];
        this.round = 0;
        this.cardCzar = null;
        this.selections = new Map();
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p !== player);
    }

    startGame() {
        this.dealCards();
        this.nextRound();
    }

    dealCards() {
        this.players.forEach(player => {
            while (player.hand.length < 10) {
                const card = this.drawWhiteCard();
                player.hand.push(card);
            }
        });
    }

    drawWhiteCard() {
        if (this.whiteCards.length === 0) {
            this.whiteCards = [...this.playedWhiteCards];
            this.playedWhiteCards = [];
        }
        const index = Math.floor(Math.random() * this.whiteCards.length);
        const card = this.whiteCards.splice(index, 1)[0];
        return card;
    }

    drawBlackCard() {
        if (this.blackCards.length === 0) {
            this.blackCards = [...this.playedBlackCards];
            this.playedBlackCards = [];
        }
        const index = Math.floor(Math.random() * this.blackCards.length);
        const card = this.blackCards.splice(index, 1)[0];
        return card;
    }

    nextRound() {
        this.round++;
        this.selections.clear();
        this.cardCzar = this.players[(this.round - 1) % this.players.length];
        this.currentBlackCard = this.drawBlackCard();
        this.dealCards();
    }

    playCard(player, card) {
        if (player !== this.cardCzar) {
            this.selections.set(player, card);
            player.hand = player.hand.filter(c => c !== card);
            this.playedWhiteCards.push(card);
        }
    }

    allCardsPlayed() {
        return this.selections.size === this.players.length - 1;
    }

    chooseWinner(winningCard) {
        let winner = null;
        for (const [player, card] of this.selections.entries()) {
            if (card === winningCard) {
                winner = player;
                break;
            }
        }
        if (winner) {
            winner.score++;
        }
        this.nextRound();
        return winner;
    }
}

module.exports = Game;
