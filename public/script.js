const socket = io();

// Estado do cliente
let currentRoomId = null;
let myId = null;
let selectedCards = []; // Agora pode ter múltiplas cartas
let gameState = null;
let pickCount = 1; // Quantas cartas precisam ser jogadas
let timerInterval = null; // Intervalo do timer visual
let timeRemaining = 0; // Tempo restante em segundos
let currentPhase = null; // Rastrear mudanças de fase para evitar reiniciar timer

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
const timerContainer = document.getElementById('timer-container');
const timerDisplay = document.getElementById('timer-display');
const playersScores = document.getElementById('players-scores');
const blackCard = document.getElementById('black-card');
const playedCardsSection = document.getElementById('played-cards-section');
const playedCards = document.getElementById('played-cards');
const roundResult = document.getElementById('round-result');
const gameResult = document.getElementById('game-result');
const yourHand = document.getElementById('your-hand');
const yourHandSection = document.getElementById('your-hand-section');
const handStatus = document.getElementById('hand-status');
const pickIndicator = document.getElementById('pick-indicator');
const submitCardsBtn = document.getElementById('submit-cards');
const nextRoundBtn = document.getElementById('next-round');
const restartGameBtn = document.getElementById('restart-game');
const leaveGameBtn = document.getElementById('leave-game');

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

restartGameBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('restartGame', currentRoomId);
    }
});

leaveGameBtn.addEventListener('click', () => {
    location.reload();
});

submitCardsBtn.addEventListener('click', () => {
    if (selectedCards.length === pickCount) {
        playCards(selectedCards);
    } else {
        showNotification(`Selecione exatamente ${pickCount} carta(s)`, 'error');
    }
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

socket.on('playerJoinedLate', (message) => {
    showNotification(message, 'info');
});

socket.on('gameRestarted', (message) => {
    showNotification(message, 'success');
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
        playerCountEl.textContent = `${game.players.length}`;
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

// Funções de controle do timer
function startTimer(duration, isJudging = false) {
    // Limpar timer anterior se existir
    stopTimer();
    
    timeRemaining = duration;
    timerContainer.style.display = 'flex';
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            stopTimer();
            return;
        }
        
        updateTimerDisplay();
        
        // Adicionar classe de warning quando faltar 20 segundos
        if (timeRemaining <= 20) {
            timerContainer.classList.add('warning');
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerContainer.style.display = 'none';
    timerContainer.classList.remove('warning');
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updatePhase(game, isCzar) {
    roundResult.style.display = 'none';
    gameResult.style.display = 'none';
    playedCardsSection.style.display = 'none';

    // Atualizar pickCount global
    pickCount = game.pickCount || 1;
    
    // Verificar se a fase mudou
    const phaseChanged = currentPhase !== game.phase;
    currentPhase = game.phase;

    if (game.phase === 'playing') {
        const cardText = pickCount > 1 ? 'cartas' : 'carta';
        phaseText.textContent = isCzar
            ? 'Aguardando os jogadores escolherem...'
            : `Escolha ${pickCount} ${cardText}!`;

        const nonCzarPlayers = game.players.filter(p => p.id !== game.cardCzar.id).length;
        handStatus.textContent = `(${game.playedCardsCount}/${nonCzarPlayers} jogaram)`;
        
        // Iniciar timer de 1 minuto APENAS quando a fase mudar
        if (phaseChanged) {
            startTimer(60);
        }
    } else if (game.phase === 'judging') {
        phaseText.textContent = isCzar
            ? 'Escolha a melhor resposta!'
            : 'Aguardando o Card Czar escolher...';

        handStatus.textContent = '';

        // Mostrar cartas jogadas
        playedCardsSection.style.display = 'block';
        displayPlayedCards(game.playedCards, isCzar);
        
        // Iniciar timer de 3 minutos APENAS quando a fase mudar
        if (phaseChanged) {
            startTimer(180, true);
        }
    } else if (game.phase === 'round_end') {
        phaseText.textContent = 'Rodada finalizada!';
        handStatus.textContent = '';

        // Mostrar resultado da rodada
        displayRoundResult(game);
        
        // Parar timer
        stopTimer();
    } else if (game.phase === 'game_end') {
        phaseText.textContent = 'Jogo finalizado!';
        handStatus.textContent = '';

        // Mostrar resultado do jogo
        showGameResult(game.roundWinner.name);
        
        // Parar timer
        stopTimer();
    }
}

function updateHand(hand, phase, isCzar) {
    yourHand.innerHTML = '';
    selectedCards = []; // Resetar seleção

    if (isCzar || phase === 'judging' || phase === 'round_end') {
        yourHandSection.style.display = 'none';
        submitCardsBtn.style.display = 'none';
        return;
    }

    yourHandSection.style.display = 'block';

    // Atualizar indicador de quantas cartas selecionar
    // SEMPRE mostrar o botão de confirmar
    if (pickIndicator) {
        if (pickCount > 1) {
            pickIndicator.textContent = ` - Selecione ${pickCount} cartas`;
        } else {
            pickIndicator.textContent = ` - Selecione 1 carta`;
        }
        pickIndicator.style.color = '#ffd700';
        submitCardsBtn.style.display = 'block';
    }

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

            // Sempre usar seleção com botão de confirmar
            const cardIndex = selectedCards.findIndex(c => c.text === card.text);
            
            if (cardIndex > -1) {
                // Desselecionar
                selectedCards.splice(cardIndex, 1);
                cardDiv.classList.remove('selected');
            } else {
                // Selecionar (se ainda não atingiu o limite)
                if (selectedCards.length < pickCount) {
                    selectedCards.push(card);
                    cardDiv.classList.add('selected');
                } else {
                    // Se já atingiu o limite, remover primeira seleção e adicionar nova
                    if (pickCount === 1) {
                        yourHand.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                        selectedCards = [card];
                        cardDiv.classList.add('selected');
                    } else {
                        showNotification(`Você só pode selecionar ${pickCount} cartas`, 'error');
                    }
                }
            }

            // Atualizar indicador
            if (pickCount > 1) {
                pickIndicator.textContent = ` - ${selectedCards.length}/${pickCount} selecionadas`;
            } else {
                pickIndicator.textContent = selectedCards.length === 1 
                    ? ` - 1 carta selecionada` 
                    : ` - Selecione 1 carta`;
            }
        });

        // Adicionar animação de entrada
        cardDiv.style.animation = 'slideInRight 0.5s ease-out forwards';

        yourHand.appendChild(cardDiv);
    });
}

function playCards(cards) {
    if (!currentRoomId || !cards || cards.length === 0) return;

    const cardTexts = cards.map(c => c.text);
    socket.emit('playCard', { roomId: currentRoomId, cardTexts });
    selectedCards = [];
    showNotification(`${cards.length} carta(s) jogada(s)!`, 'success');
}

function displayPlayedCards(cards, isCzar) {
    playedCards.innerHTML = '';

    cards.forEach((playedCard, index) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'played-card-container';
        cardContainer.style.animationDelay = `${index * 0.1}s`;
        
        // Pegar as cartas (pode ser uma ou múltiplas)
        const cardsArray = Array.isArray(playedCard.cards) ? playedCard.cards : [playedCard.cards];
        
        // Se tiver múltiplas cartas, adicionar indicador
        if (cardsArray.length > 1) {
            const indicator = document.createElement('div');
            indicator.className = 'card-group-indicator';
            indicator.textContent = cardsArray.length;
            indicator.title = `${cardsArray.length} cartas`;
            cardContainer.appendChild(indicator);
        }
        
        // Criar as cartas dentro do container
        cardsArray.forEach((card, cardIdx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card card-white';
            cardDiv.innerHTML = `
                <div class="card-header">CARTAS CONTRA A HUMANIDADE</div>
                <div class="card-text">${card.text}</div>
            `;
            
            if (cardsArray.length > 1) {
                cardDiv.classList.add('multiple-card');
            }
            
            cardContainer.appendChild(cardDiv);
        });

        if (isCzar) {
            cardContainer.classList.add('clickable');
            cardContainer.title = 'Clique para escolher esta resposta como vencedora';
            
            cardContainer.addEventListener('click', () => {
                // Adicionar feedback visual
                const originalTransform = cardContainer.style.transform;
                cardContainer.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    const cardsIdentifier = cardsArray.map(c => c.text).join('|');
                    socket.emit('chooseWinner', {
                        roomId: currentRoomId,
                        cardsIdentifier
                    });
                }, 150);
            });
            
            // Adicionar efeito hover adicional
            cardContainer.addEventListener('mouseenter', () => {
                cardContainer.style.background = 'rgba(0, 212, 255, 0.15)';
            });
            
            cardContainer.addEventListener('mouseleave', () => {
                cardContainer.style.background = 'rgba(255, 255, 255, 0.05)';
            });
        }

        // Adicionar animação de entrada
        cardContainer.style.animation = 'cardFlip 0.6s ease-out forwards';

        playedCards.appendChild(cardContainer);
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
        
        // Apenas o host pode ver o botão de reiniciar
        const restartBtn = document.getElementById('restart-game');
        const leaveBtn = document.getElementById('leave-game');
        if (gameState.hostId === myId) {
            restartBtn.style.display = 'inline-block';
            leaveBtn.style.display = 'none';
        } else {
            restartBtn.style.display = 'none';
            leaveBtn.style.display = 'inline-block';
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
