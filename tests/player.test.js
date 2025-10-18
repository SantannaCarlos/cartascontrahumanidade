import Player from '../src/player.js';

describe('Player', () => {
  it('should create a player with a unique ID and a name', () => {
    const player = new Player('John');
    expect(player.id).toBeDefined();
    expect(player.name).toBe('John');
  });

  it('should add a card to the player\'s hand', () => {
    const player = new Player('John');
    const card = { text: 'This is a card' };
    player.addCard(card);
    expect(player.hand).toContain(card);
  });

  it('should play a card from the player\'s hand', () => {
    const player = new Player('John');
    const card = { text: 'This is a card' };
    player.addCard(card);
    const playedCard = player.playCard(card);
    expect(playedCard).toBe(card);
    expect(player.hand).not.toContain(card);
  });
});