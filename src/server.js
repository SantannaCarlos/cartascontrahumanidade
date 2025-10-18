import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Game from './game.js';
import Player from './player.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

const rooms = new Map();
const socketToRoom = new Map(); // Mapear socket ID para room ID

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('createRoom', (username) => {
        try {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const player = new Player(username, socket.id);
            const game = new Game(socket.id); // Passa o ID do host
            game.addPlayer(player);
            rooms.set(roomId, game);
            socketToRoom.set(socket.id, roomId);

            socket.join(roomId);
            socket.emit('roomCreated', roomId);
            updateGame(roomId, socket.id);
            console.log(`Sala ${roomId} criada por ${username} (HOST)`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('joinRoom', ({ roomId, username }) => {
        try {
            roomId = roomId.toUpperCase().trim();

            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);
            const player = new Player(username, socket.id);

            // Se o jogo já começou, adicionar como jogador atrasado
            if (game.started) {
                game.addLatePlayer(player);
                socketToRoom.set(socket.id, roomId);
                socket.join(roomId);
                socket.emit('joinedRoom', roomId);
                updateGame(roomId);
                io.to(roomId).emit('playerJoinedLate', `${username} entrou no jogo`);
                console.log(`${username} entrou atrasado na sala ${roomId}`);
            } else {
                game.addPlayer(player);
                socketToRoom.set(socket.id, roomId);
                socket.join(roomId);
                socket.emit('joinedRoom', roomId);
                updateGame(roomId);
                console.log(`${username} entrou na sala ${roomId}`);
            }
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('startGame', ({ roomId, maxScore }) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);

            // Verificar se é o host
            if (!game.isHost(socket.id)) {
                socket.emit('gameError', 'Apenas o host pode iniciar o jogo');
                return;
            }

            if (game.players.length < 3) {
                socket.emit('gameError', 'Precisa de pelo menos 3 jogadores para começar');
                return;
            }

            // Definir maxScore se fornecido
            if (maxScore) {
                game.setMaxScore(maxScore);
            }

            game.startGame();
            updateGame(roomId);
            console.log(`Jogo iniciado na sala ${roomId} com ${game.maxScore} pontos para vencer`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('updateSettings', ({ roomId, maxScore }) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);

            // Verificar se é o host
            if (!game.isHost(socket.id)) {
                socket.emit('gameError', 'Apenas o host pode alterar as configurações');
                return;
            }

            // Não permitir mudança se o jogo já começou
            if (game.started) {
                socket.emit('gameError', 'Não é possível alterar configurações durante o jogo');
                return;
            }

            // Atualizar configurações
            if (maxScore) {
                game.setMaxScore(maxScore);
            }

            updateGame(roomId);
            console.log(`Configurações atualizadas na sala ${roomId}: ${game.maxScore} pontos para vencer`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('playCard', ({ roomId, cardTexts }) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);
            const player = game.players.find(p => p.id === socket.id);

            if (!player) {
                socket.emit('gameError', 'Jogador não encontrado');
                return;
            }

            // Converter para array se não for
            const textsArray = Array.isArray(cardTexts) ? cardTexts : [cardTexts];
            
            // Encontrar as cartas na mão
            const cards = textsArray.map(text => {
                const card = player.hand.find(c => c.text === text);
                if (!card) {
                    throw new Error('Carta não encontrada na sua mão');
                }
                return card;
            });

            game.playCard(player, cards);
            updateGame(roomId);
            console.log(`${player.name} jogou ${cards.length} carta(s) na sala ${roomId}`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('chooseWinner', ({ roomId, cardsIdentifier }) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);
            const player = game.players.find(p => p.id === socket.id);

            if (!player) {
                socket.emit('gameError', 'Jogador não encontrado');
                return;
            }

            if (game.getCardCzar().id !== socket.id) {
                socket.emit('gameError', 'Apenas o Card Czar pode escolher o vencedor');
                return;
            }

            const result = game.chooseWinner(cardsIdentifier);
            io.to(roomId).emit('roundWinner', {
                winner: result.winner.name,
                cards: cardsIdentifier,
                gameEnded: result.gameEnded
            });
            updateGame(roomId);
            console.log(`${result.winner.name} ganhou a rodada na sala ${roomId}`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('restartGame', (roomId) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);

            // Verificar se é o host
            if (!game.isHost(socket.id)) {
                socket.emit('gameError', 'Apenas o host pode reiniciar o jogo');
                return;
            }

            if (game.players.length < 3) {
                socket.emit('gameError', 'Precisa de pelo menos 3 jogadores para começar');
                return;
            }

            game.restartGame();
            updateGame(roomId);
            io.to(roomId).emit('gameRestarted', 'O jogo foi reiniciado!');
            console.log(`Jogo reiniciado na sala ${roomId}`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('kickPlayer', ({ roomId, playerId }) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);

            // Verificar se é o host
            if (!game.isHost(socket.id)) {
                socket.emit('gameError', 'Apenas o host pode expulsar jogadores');
                return;
            }

            // Não pode expulsar a si mesmo
            if (playerId === socket.id) {
                socket.emit('gameError', 'Você não pode expulsar a si mesmo');
                return;
            }

            const kicked = game.kickPlayer(playerId);
            
            if (kicked) {
                // Notificar o jogador expulso
                const kickedSocket = io.sockets.sockets.get(playerId);
                if (kickedSocket) {
                    kickedSocket.emit('kicked', 'Você foi expulso da sala pelo host');
                    kickedSocket.leave(roomId);
                }
                
                socketToRoom.delete(playerId);
                updateGame(roomId);
                console.log(`Jogador ${playerId} foi expulso da sala ${roomId}`);
            }
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('nextRound', (roomId) => {
        try {
            if (!rooms.has(roomId)) {
                socket.emit('gameError', 'Sala não encontrada');
                return;
            }

            const game = rooms.get(roomId);

            if (game.phase !== 'round_end') {
                socket.emit('gameError', 'Não é possível avançar para a próxima rodada agora');
                return;
            }

            game.continueToNextRound();
            updateGame(roomId);
            console.log(`Próxima rodada iniciada na sala ${roomId}`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);

        const roomId = socketToRoom.get(socket.id);
        if (roomId && rooms.has(roomId)) {
            const game = rooms.get(roomId);
            const player = game.players.find(p => p.id === socket.id);

            if (player) {
                console.log(`${player.name} saiu da sala ${roomId}`);
                game.removePlayer(player);

                if (game.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Sala ${roomId} removida (vazia)`);
                } else {
                    updateGame(roomId);
                }
            }
        }

        socketToRoom.delete(socket.id);
    });

    function updateGame(roomId, specificSocketId = null) {
        if (!rooms.has(roomId)) return;

        const game = rooms.get(roomId);
        const gameState = game.getGameState();

        // Enviar estado do jogo para cada jogador (com suas cartas)
        game.players.forEach(player => {
            const playerSocket = io.sockets.sockets.get(player.id);
            if (playerSocket) {
                playerSocket.emit('updateGame', {
                    ...gameState,
                    yourHand: player.hand,
                    yourId: player.id
                });
            }
        });

        // Se especificado, enviar para um socket específico também
        if (specificSocketId) {
            const specificSocket = io.sockets.sockets.get(specificSocketId);
            if (specificSocket) {
                const player = game.players.find(p => p.id === specificSocketId);
                specificSocket.emit('updateGame', {
                    ...gameState,
                    yourHand: player ? player.hand : [],
                    yourId: specificSocketId
                });
            }
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});