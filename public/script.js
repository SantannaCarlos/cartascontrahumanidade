const socket = io();

const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const roomSelectionDiv = document.getElementById('room-selection');
const gameRoomDiv = document.getElementById('game-room');
const roomCodeH2 = document.getElementById('room-code');
const playersDiv = document.getElementById('players');
const blackCardDiv = document.getElementById('black-card');
const whiteCardsDiv = document.getElementById('white-cards');
const startGameBtn = document.getElementById('start-game');
const playCardBtn = document.getElementById('play-card');
const chooseWinnerBtn = document.getElementById('choose-winner');

let selectedWhiteCard = null;

createRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value;
    if (username) {
        socket.emit('createRoom', username);
    }
});

joinRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value;
    const roomId = roomIdInput.value;
    if (username && roomId) {
        socket.emit('joinRoom', { roomId, username });
    }
});

socket.on('roomCreated', (roomId) => {
    roomSelectionDiv.style.display = 'none';
    gameRoomDiv.style.display = 'block';
    roomCodeH2.textContent = `Room ID: ${roomId}`;
});

socket.on('joinedRoom', (roomId) => {
    roomSelectionDiv.style.display = 'none';
    gameRoomDiv.style.display = 'block';
    roomCodeH2.textContent = `Room ID: ${roomId}`;
});

socket.on('updateGame', (game) => {
    playersDiv.innerHTML = '';
    game.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');
        playerCard.textContent = player.name;
        playersDiv.appendChild(playerCard);
    });

    if (game.blackCard) {
        blackCardDiv.textContent = game.blackCard.text;
    } else {
        blackCardDiv.textContent = 'Waiting for game to start...';
    }

    whiteCardsDiv.innerHTML = '';
    const currentPlayer = game.players.find(p => p.id === socket.id);
    if (currentPlayer) {
        currentPlayer.hand.forEach(card => {
            const whiteCard = document.createElement('div');
            whiteCard.classList.add('white-card');
            whiteCard.textContent = card.text;
            whiteCard.addEventListener('click', () => {
                if (selectedWhiteCard) {
                    selectedWhiteCard.classList.remove('selected');
                }
                whiteCard.classList.add('selected');
                selectedWhiteCard = whiteCard;
            });
            whiteCardsDiv.appendChild(whiteCard);
        });
    }
});

socket.on('error', (message) => {
    alert(message);
});

startGameBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value || roomCodeH2.textContent.split(': ')[1];
    socket.emit('startGame', roomId);
});

playCardBtn.addEventListener('click', () => {
    if (selectedWhiteCard) {
        const roomId = roomIdInput.value || roomCodeH2.textContent.split(': ')[1];
        const cardText = selectedWhiteCard.textContent;
        socket.emit('playCard', { roomId, card: { text: cardText } });
        selectedWhiteCard.remove();
        selectedWhiteCard = null;
    } else {
        alert('Please select a white card to play.');
    }
});

chooseWinnerBtn.addEventListener('click', () => {
    if (selectedWhiteCard) {
        const roomId = roomIdInput.value || roomCodeH2.textContent.split(': ')[1];
        const cardText = selectedWhiteCard.textContent;
        socket.emit('chooseWinner', { roomId, card: { text: cardText } });
        selectedWhiteCard = null;
    } else {
        alert('Please select a white card to choose as winner.');
    }
});