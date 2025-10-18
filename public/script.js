const socket = io();

const menu = document.getElementById('menu');
const gameDiv = document.getElementById('game');
const usernameInput = document.getElementById('username');
const createRoomBtn = document.getElementById('createRoom');
const roomIdInput = document.getElementById('roomIdInput');
const joinRoomBtn = document.getElementById('joinRoom');
const roomIdDisplay = document.getElementById('room-id');
const playersDiv = document.getElementById('players');
const startGameBtn = document.getElementById('startGame');
const blackCardDiv = document.getElementById('black-card');
const whiteCardsDiv = document.getElementById('white-cards');
const selectionsDiv = document.getElementById('selections');
const chooseWinnerBtn = document.getElementById('chooseWinner');

let roomId = null;
let isHost = false;

createRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value;
    if (username) {
        socket.emit('createRoom', username);
        isHost = true;
    }
});

joinRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value;
    const id = roomIdInput.value;
    if (username && id) {
        roomId = id;
        socket.emit('joinRoom', { roomId, username });
    }
});

startGameBtn.addEventListener('click', () => {
    if (roomId && isHost) {
        socket.emit('startGame', roomId);
    }
});

chooseWinnerBtn.addEventListener('click', () => {
    const selectedCard = document.querySelector('.selection-card.selected');
    if (selectedCard) {
        const cardText = selectedCard.textContent;
        socket.emit('chooseWinner', { roomId, card: cardText });
    }
});

socket.on('roomCreated', (id) => {
    roomId = id;
    menu.style.display = 'none';
    gameDiv.style.display = 'block';
    roomIdDisplay.textContent = `Room ID: ${roomId}`;
    startGameBtn.style.display = 'block';
});

socket.on('joinedRoom', (id) => {
    roomId = id;
    menu.style.display = 'none';
    gameDiv.style.display = 'block';
    roomIdDisplay.textContent = `Room ID: ${roomId}`;
});

socket.on('updateGame', (game) => {
    playersDiv.innerHTML = '<h3>Players:</h3>';
    game.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = `${player.name}: ${player.score}`;
        playersDiv.appendChild(playerDiv);
    });

    if (game.currentBlackCard) {
        blackCardDiv.innerHTML = `<h3>Black Card:</h3><div class="card black-card">${game.currentBlackCard}</div>`;
    } else {
        blackCardDiv.innerHTML = '';
    }

    const me = game.players.find(p => p.id === socket.id);
    if (me) {
        whiteCardsDiv.innerHTML = '<h3>Your Hand:</h3>';
        me.hand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card', 'white-card');
            cardDiv.textContent = card;
            cardDiv.addEventListener('click', () => {
                if (me !== game.cardCzar) {
                    socket.emit('playCard', { roomId, card });
                }
            });
            whiteCardsDiv.appendChild(cardDiv);
        });
    }

    selectionsDiv.innerHTML = '<h3>Selections:</h3>';
    if (game.selections) {
        for (const [player, card] of Object.entries(game.selections)) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card', 'selection-card');
            cardDiv.textContent = card;
            if (me === game.cardCzar) {
                cardDiv.addEventListener('click', () => {
                    document.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
                    cardDiv.classList.add('selected');
                });
            }
            selectionsDiv.appendChild(cardDiv);
        }
    }


    if (me === game.cardCzar && game.allCardsPlayed()) {
        chooseWinnerBtn.style.display = 'block';
    } else {
        chooseWinnerBtn.style.display = 'none';
    }

    if (isHost && !game.round) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
});

socket.on('winnerChosen', ({ winner, card }) => {
    alert(`${winner} won the round with "${card}"!`);
});

socket.on('error', (message) => {
    alert(message);
});