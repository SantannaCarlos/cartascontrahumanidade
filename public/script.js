const socket = io();

// Estado do cliente
let currentRoomId = null;
let myId = null;
let selectedCard = null;
let gameState = null;

// Elementos DOM - Lobby
const lobbyScreen = document.getElementById('lobby-screen');
const waitingRoom = document.getElementById('waiting-room');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');

// Elementos DOM - Sala de espera
const roomCodeSpan = document.getElementById('room-code');
const copyCodeBtn = document.getElementById('copy-code');
const waitingPlayers = document.getElementById('waiting-players');
const startGameBtn = document.getElementById('start-game');
const leaveRoomBtn = document.getElementById('leave-room');

// Elementos DOM - Jogo
const gameRoomCodeSpan = document.getElementById('game-room-code');
const phaseText = document.getElementById('phase-text');
const czarText = document.getElementById('czar-text');
const playersScores = document.getElementById('players-scores');
const blackCard = document.getElementById('black-card');
const playedCardsSection = document.getElementById('played-cards-section');
const playedCards = document.getElementById('played-cards');
const roundResult = document.getElementById('round-result');
const gameResult = document.getElementById('game-result');
const yourHand = document.getElementById('your-hand');
const yourHandSection = document.getElementById('your-hand-section');
const handStatus = document.getElementById('hand-status');
const nextRoundBtn = document.getElementById('next-round');
const newGameBtn = document.getElementById('new-game');

// Elementos DOM - Notificações
const notification = document.getElementById('notification');

// Event Listeners - Lobby
createRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) {
        showNotification('Por favor, digite seu nome', 'error');
        return;
    }
    socket.emit('createRoom', username);
});

joinRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const roomId = roomIdInput.value.trim().toUpperCase();
    if (!username) {
        showNotification('Por favor, digite seu nome', 'error');
        return;
    }
    if (!roomId) {
        showNotification('Por favor, digite o código da sala', 'error');
        return;
    }
    socket.emit('joinRoom', { roomId, username });
});

// Event Listeners - Sala de espera
copyCodeBtn.addEventListener('click', () => {
    const code = roomCodeSpan.textContent;
    navigator.clipboard.writeText(code).then(() => {
        showNotification('Código copiado!', 'success');
    });
});

// Atualizar configurações quando o host muda
document.getElementById('max-score')?.addEventListener('change', (e) => {
    const maxScore = parseInt(e.target.value);
    if (currentRoomId) {
        socket.emit('updateSettings', { roomId: currentRoomId, maxScore });
    }
});

startGameBtn.addEventListener('click', () => {
    if (currentRoomId) {
        const maxScore = parseInt(document.getElementById('max-score').value);
        socket.emit('startGame', { roomId: currentRoomId, maxScore });
    }
});

leaveRoomBtn.addEventListener('click', () => {
    location.reload();
});

nextRoundBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('nextRound', currentRoomId);
    }
});

newGameBtn.addEventListener('click', () => {
    location.reload();
});

// Permitir pressionar Enter nos inputs
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createRoomBtn.click();
});

roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoomBtn.click();
});

// Socket Events
socket.on('roomCreated', (roomId) => {
    currentRoomId = roomId;
    roomCodeSpan.textContent = roomId;
    switchScreen('waiting');
    showNotification('Sala criada com sucesso!', 'success');
});

socket.on('joinedRoom', (roomId) => {
    currentRoomId = roomId;
    roomCodeSpan.textContent = roomId;
    switchScreen('waiting');
    showNotification('Você entrou na sala!', 'success');
});

socket.on('kicked', (message) => {
    showNotification(message, 'error');
    setTimeout(() => {
        location.reload();
    }, 2000);
});

socket.on('updateGame', (game) => {
    gameState = game;
    myId = game.yourId;

    if (!game.started) {
        // Sala de espera
        updateWaitingRoom(game);
    } else {
        // Jogo em andamento
        gameRoomCodeSpan.textContent = currentRoomId;
        switchScreen('game');
        updateGameScreen(game);
    }
});

socket.on('roundWinner', (data) => {
    showNotification(`${data.winner} ganhou a rodada!`, 'success');

    if (data.gameEnded) {
        // Mostrar tela de fim de jogo
        setTimeout(() => {
            showGameResult(data.winner);
        }, 2000);
    }
});

socket.on('gameError', (message) => {
    showNotification(message, 'error');
});

// Funções auxiliares
function switchScreen(screen) {
    lobbyScreen.style.display = 'none';
    waitingRoom.style.display = 'none';
    gameScreen.style.display = 'none';

    if (screen === 'lobby') {
        lobbyScreen.style.display = 'block';
    } else if (screen === 'waiting') {
        waitingRoom.style.display = 'block';
    } else if (screen === 'game') {
        gameScreen.style.display = 'block';
    }
}

function updateWaitingRoom(game) {
    waitingPlayers.innerHTML = '';
    
    // Atualizar contador de jogadores
    const playerCountEl = document.getElementById('player-count');
    if (playerCountEl) {
        playerCountEl.textContent = `${game.players.length}/10`;
    }
    
    const isHost = game.hostId === myId;
    
    // Mostrar/esconder configurações do jogo
    const gameSettingsDiv = document.getElementById('game-settings');
    if (gameSettingsDiv) {
        gameSettingsDiv.style.display = isHost ? 'block' : 'none';
    }
    
    // Atualizar o valor do maxScore se disponível
    const maxScoreSelect = document.getElementById('max-score');
    if (maxScoreSelect && game.maxScore) {
        maxScoreSelect.value = game.maxScore;
    }
    
    game.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.style.animationDelay = `${index * 0.1}s`;
        
        const playerEmoji = ['👤', '🎮', '🎲', '🃏', '👾', '🎯', '🎪', '🎨'][index % 8];
        
        // Container para nome e badges
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const playerName = document.createElement('span');
        playerName.textContent = `${playerEmoji} ${player.name}`;
        
        if (player.id === myId) {
            playerDiv.classList.add('you');
            playerName.textContent += ' (Você)';
        }
        
        if (player.isHost) {
            const hostBadge = document.createElement('span');
            hostBadge.className = 'host-badge';
            hostBadge.textContent = '👑 HOST';
            playerInfo.appendChild(hostBadge);
        }
        
        playerInfo.appendChild(playerName);
        playerDiv.appendChild(playerInfo);
        
        // Botão de expulsar (apenas para host e não pode expulsar a si mesmo)
        if (isHost && player.id !== myId) {
            const kickBtn = document.createElement('button');
            kickBtn.className = 'kick-btn';
            kickBtn.innerHTML = '❌';
            kickBtn.title = 'Expulsar jogador';
            kickBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Deseja expulsar ${player.name}?`)) {
                    socket.emit('kickPlayer', {
                        roomId: currentRoomId,
                        playerId: player.id
                    });
                }
            };
            playerDiv.appendChild(kickBtn);
        }
        
        waitingPlayers.appendChild(playerDiv);
    });

    // Mostrar/esconder botão de iniciar baseado se é host
    if (isHost) {
        startGameBtn.style.display = 'block';
        startGameBtn.disabled = game.players.length < 3;
        
        // Adicionar texto explicativo no botão
        if (game.players.length < 3) {
            startGameBtn.innerHTML = `<span class="btn-icon">🎲</span> Aguardando mais jogadores (${game.players.length}/3)`;
        } else {
            startGameBtn.innerHTML = `<span class="btn-icon">🎲</span> Iniciar Jogo`;
        }
    } else {
        startGameBtn.style.display = 'none';
    }
}

function updateGameScreen(game) {
    // Atualizar meta de pontos
    const gameMaxScoreEl = document.getElementById('game-max-score');
    if (gameMaxScoreEl) {
        gameMaxScoreEl.textContent = game.maxScore;
    }

    // Atualizar placar
    playersScores.innerHTML = '';
    game.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-score';

        if (game.cardCzar && player.id === game.cardCzar.id) {
            playerDiv.classList.add('is-czar');
        }

        if (player.id === myId) {
            playerDiv.classList.add('is-you');
        }

        const hostBadge = player.isHost ? ' 👑' : '';
        
        playerDiv.innerHTML = `
            <span class="player-name">${player.name}${player.id === myId ? ' (Você)' : ''}${hostBadge}</span>
            <span class="player-score-value">${player.score} pts</span>
        `;
        playersScores.appendChild(playerDiv);
    });

    // Atualizar carta preta
    if (game.blackCard) {
        blackCard.querySelector('.card-text').textContent = game.blackCard.text;
    }

    // Atualizar indicadores
    const isCzar = game.cardCzar && game.cardCzar.id === myId;
    czarText.textContent = isCzar
        ? '👑 Você é o Card Czar!'
        : `👑 Card Czar: ${game.cardCzar ? game.cardCzar.name : ''}`;

    // Atualizar fase
    updatePhase(game, isCzar);

    // Atualizar mão
    updateHand(game.yourHand, game.phase, isCzar);
}

function updatePhase(game, isCzar) {
    roundResult.style.display = 'none';
    gameResult.style.display = 'none';
    playedCardsSection.style.display = 'none';

    if (game.phase === 'playing') {
        phaseText.textContent = isCzar
            ? 'Aguardando os jogadores escolherem...'
            : 'Escolha uma carta!';

        handStatus.textContent = `(${game.playedCardsCount}/${game.players.length - 1} jogaram)`;
    } else if (game.phase === 'judging') {
        phaseText.textContent = isCzar
            ? 'Escolha a melhor resposta!'
            : 'Aguardando o Card Czar escolher...';

        handStatus.textContent = '';

        // Mostrar cartas jogadas
        playedCardsSection.style.display = 'block';
        displayPlayedCards(game.playedCards, isCzar);
    } else if (game.phase === 'round_end') {
        phaseText.textContent = 'Rodada finalizada!';
        handStatus.textContent = '';

        // Mostrar resultado da rodada
        displayRoundResult(game);
    } else if (game.phase === 'game_end') {
        phaseText.textContent = 'Jogo finalizado!';
        handStatus.textContent = '';

        // Mostrar resultado do jogo
        showGameResult(game.roundWinner.name);
    }
}

function updateHand(hand, phase, isCzar) {
    yourHand.innerHTML = '';

    if (isCzar || phase === 'judging' || phase === 'round_end') {
        yourHandSection.style.display = 'none';
        return;
    }

    yourHandSection.style.display = 'block';

    hand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card card-white';
        cardDiv.style.animationDelay = `${index * 0.05}s`;
        cardDiv.innerHTML = `
            <div class="card-header">CARTAS CONTRA A HUMANIDADE</div>
            <div class="card-text">${card.text}</div>
        `;

        cardDiv.addEventListener('click', () => {
            if (phase !== 'playing') return;

            // Remover seleção anterior
            yourHand.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));

            // Selecionar nova carta
            cardDiv.classList.add('selected');
            selectedCard = card;

            // Adicionar pequeno delay antes de jogar
            setTimeout(() => {
                playCard(card);
            }, 300);
        });

        // Adicionar animação de entrada
        cardDiv.style.animation = 'slideInRight 0.5s ease-out forwards';

        yourHand.appendChild(cardDiv);
    });
}

function playCard(card) {
    if (!currentRoomId || !card) return;

    socket.emit('playCard', { roomId: currentRoomId, cardText: card.text });
    selectedCard = null;
    showNotification('Carta jogada!', 'success');
}

function displayPlayedCards(cards, isCzar) {
    playedCards.innerHTML = '';

    cards.forEach((playedCard, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card card-white';
        cardDiv.style.animationDelay = `${index * 0.1}s`;
        cardDiv.innerHTML = `
            <div class="card-header">CARTAS CONTRA A HUMANIDADE</div>
            <div class="card-text">${playedCard.card.text}</div>
        `;

        if (isCzar) {
            cardDiv.style.cursor = 'pointer';
            cardDiv.title = 'Clique para escolher esta carta como vencedora';
            
            cardDiv.addEventListener('click', () => {
                // Adicionar feedback visual
                cardDiv.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    socket.emit('chooseWinner', {
                        roomId: currentRoomId,
                        cardText: playedCard.card.text
                    });
                }, 150);
            });

            // Não precisamos mais dos event listeners de mouse, o CSS :hover já cuida disso
        } else {
            cardDiv.style.cursor = 'default';
        }

        // Adicionar animação de entrada
        cardDiv.style.animation = 'cardFlip 0.6s ease-out forwards';

        playedCards.appendChild(cardDiv);
    });
}

function displayRoundResult(game) {
    if (!game.roundWinner || !game.winningCard) return;

    roundResult.style.display = 'block';
    roundResult.querySelector('.winner-name').textContent = game.roundWinner.name;
    roundResult.querySelector('.winning-card .card-text').textContent = game.winningCard.text;
}

function showGameResult(winnerName) {
    gameResult.style.display = 'block';
    gameResult.querySelector('.game-winner-name').textContent = `Vencedor: ${winnerName}!`;

    if (gameState) {
        const winner = gameState.players.find(p => p.name === winnerName);
        if (winner) {
            gameResult.querySelector('.game-winner-score').textContent = `${winner.score} pontos`;
        }
    }
}

function showNotification(message, type = 'info') {
    // Adicionar ícone baseado no tipo
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };
    
    const icon = icons[type] || icons.info;
    notification.innerHTML = `<span class="notification-icon">${icon}</span> ${message}`;
    notification.className = `notification ${type} show`;

    // Adicionar som (opcional - pode ser comentado se não quiser som)
    playNotificationSound(type);

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function playNotificationSound(type) {
    // Criar um som simples usando Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frequências diferentes para cada tipo
        const frequencies = {
            success: 800,
            error: 400,
            info: 600
        };
        
        oscillator.frequency.value = frequencies[type] || frequencies.info;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Ignorar erros de áudio
        console.log('Audio not available');
    }
}
