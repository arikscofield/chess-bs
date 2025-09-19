import {Server} from "socket.io";
import Game from "./game.js";
import {AckStatus, type ClientToServerEvents, Color, type ServerToClientEvents} from "@chess-bs/common";

const port = 3000;
const clientPort = 5173;
const io = new Server<ClientToServerEvents, ServerToClientEvents>(port, {
    cors: {
        origin: "http://localhost:" + clientPort,
        methods: ["GET", "POST"],
    }
});

const games: Map<string, Game> = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("createGame", (playerId, color, callback) => {
        const gameId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const game = new Game(gameId);

        const player = game.addPlayer(playerId, color);

        if (player === null) {
            console.log("Unable to create game.");
            callback({ status: AckStatus.ERROR, message: "Unable to create game" });
            return;
        }

        games.set(gameId, game);
        console.log(`Creating game ${gameId} for player ${playerId}`);
        socket.join(gameId);
        callback({ status: AckStatus.OK, message: "Successfully created game", gameId: gameId, player: player });
    })

    socket.on("joinGame", (gameId, playerId, callback) => {
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to join game: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        // Rejoining game
        let player = game.getPlayer(playerId);
        if (player) {
            console.log("Player rejoining game")
            const gameState = game.getState();
            if (!gameState) {
                callback({ status: AckStatus.ERROR, message: "Unable to rejoin game" });
                return;
            }
            socket.join(gameId);
            io.to(gameId).emit("gameState", gameState);
            callback({ status: AckStatus.OK, message: "Successfully joined game", player: player });
            return;
        }

        // New Player
        player = game.addPlayer(playerId);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Game is full" });
            return;
        }

        console.log(`Joining game ${gameId} for player ${playerId}`);
        socket.join(gameId);
        io.to(gameId).emit("gameState", game.getState());
        callback({ status: AckStatus.OK, message: "Successfully joined game", player: player });
        console.log(game.players);
    })


    socket.on("move", (gameId, playerId, move, callback) => {
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to make move: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        const player = game.getPlayer(playerId);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Invalid player"});
            return;
        }

        // TODO: Uncomment
        if (player.color !== game.turnColor) {
            callback({ status: AckStatus.ERROR, message: "Not players turn"});
            return;
        }

        if (!game.makeMove(move, player)) {
            callback({ status: AckStatus.ERROR, message: "Failed to make move"});
            return;
        }

        game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
        io.to(gameId).emit("gameState", game.getState());
        callback({ status: AckStatus.OK, message: "Successfully made move" });

    })


    socket.on("callBluff", (gameId, playerId, callback) => {
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to make move: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        const player = game.getPlayer(playerId);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Invalid player"});
            return;
        }

        if (player.color !== game.turnColor) {
            callback({ status: AckStatus.ERROR, message: "Not players turn"});
            return;
        }

        if (game.prevBoard === null) {
            callback({ status: AckStatus.ERROR, message: "Unable to call bluff"});
            return;
        }

        if (game.lastMoveWasBluff) {
            game.board = game.prevBoard;
            game.prevBoard = null;
            game.board.enPassant = null;
            io.to(gameId).emit("gameState", game.getState());
            callback({ status: AckStatus.OK, message: "Successfully called bluff", result: true });
            return;
        } else {
            game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
            game.board.enPassant = null;
            io.to(gameId).emit("gameState", game.getState());
            callback({ status: AckStatus.OK, message: "Failed to call bluff", result: false });
            return;
        }
    })

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        // TODO: Check if both users disconnected and end/remove game
    });


});


console.log(`Server started on port ${port}`);