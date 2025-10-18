import Game from '../src/game.js';
import Player from '../src/player.js';

describe('Game', () => {
  let game;
  let player1;
  let player2;

  beforeEach(() => {
    game = new Game();
    game.cards = {
      white: [
        { text: 'Card 1' },
        { text: 'Card 2' },
        { text: 'Card 3' },
        { text: 'Card 4' },
        { text: 'Card 5' },
        { text: 'Card 6' },
        { text: 'Card 7' },
        { text: 'Card 8' },
        { text: 'Card 9' },
        { text: 'Card 10' },
        { text: 'Card 11' },
        { text: 'Card 12' },
        { text: 'Card 13' },
        { text: 'Card 14' },
        { text: 'Card 15' },
        { text: 'Card 16' },
        { text: 'Card 17' },
        { text: 'Card 18' },
        { text: 'Card 19' },
        { text: 'Card 20' },
      ],
      black: [
        { text: 'Black Card 1', pick: 1 },
        { text: 'Black Card 2', pick: 1 },
      ],
    };
    player1 = new Player('Player 1');
    player2 = new Player('Player 2');
    game.addPlayer(player1);
    game.addPlayer(player2);
  });

  it('should create a new game with a code', () => {
    expect(game.code).toBeDefined();
  });

  it('should add a player to the game', () => {
    expect(game.players).toContain(player1);
  });

  it('should remove a player from the game', () => {
    game.removePlayer(player1);
    expect(game.players).not.toContain(player1);
  });

  it('should start the game and deal cards', () => {
    game.start();
    expect(game.started).toBe(true);
    expect(player1.hand.length).toBe(10);
    expect(player2.hand.length).toBe(10);
    expect(game.blackCard).toBeDefined();
    expect(game.cardCzar).toBe(player1);
  });

  it('should allow a player to play a card', () => {
    game.start();
    const card = player1.hand[0];
    game.playCard(player1, card);
    expect(game.playedCards).toContainEqual({ player: player1, card });
  });

  it('should allow the card czar to choose a winner', () => {
    game.start();
    const card1 = player1.hand[0];
    const card2 = player2.hand[0];
    game.playCard(player1, card1);
    game.playCard(player2, card2);

    const votes = [player1, player2, player1];
    const winner = game.chooseWinner(votes);

    expect(winner).toBe(player1);
  });
});
