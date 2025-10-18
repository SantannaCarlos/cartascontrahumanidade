import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Game from './game.js';
import Player from './player.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('createRoom', (username) => {
        const roomId = Math.random().toString(36).substring(2, 8);
        const player = new Player(username, socket.id);
        const game = new Game();
        rooms.set(roomId, game);
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        updateGame(roomId);
    });

    socket.on('joinRoom', ({ roomId, username }) => {
        if (rooms.has(roomId)) {
            const game = rooms.get(roomId);
            const player = new Player(username, socket.id);
            game.addPlayer(player);
            socket.join(roomId);
            socket.emit('joinedRoom', roomId);
            updateGame(roomId);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('startGame', (roomId) => {
        if (rooms.has(roomId)) {
            const game = rooms.get(roomId);
            game.startGame();
            updateGame(roomId);
        }
    });

    socket.on('playCard', ({ roomId, card }) => {
        if (rooms.has(roomId)) {
            const game = rooms.get(roomId);
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                game.playCard(player, card);
                updateGame(roomId);
            }
        }
    });

    socket.on('chooseWinner', ({ roomId, card }) => {
        if (rooms.has(roomId)) {
            const game = rooms.get(roomId);
            const winner = game.chooseWinner(card);
            io.to(roomId).emit('winnerChosen', { winner: winner.name, card });
            updateGame(roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        for (const [roomId, game] of rooms.entries()) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                game.removePlayer(player);
                if (game.players.length === 0) {
                    rooms.delete(roomId);
                } else {
                    updateGame(roomId);
                }
                break;
            }
        }
    });

    function updateGame(roomId) {
        if (rooms.has(roomId)) {
            const game = rooms.get(roomId);
            io.to(roomId).emit('updateGame', game);
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});