import {Server} from "socket.io";
import Game from "./game.js";
import {AckStatus, type ClientToServerEvents, Color, GameStatus, type ServerToClientEvents} from "@chess-bs/common";
import {parse, serialize} from "cookie";
import {v4 as uuidv4} from 'uuid'

const port = 3000;
const clientPort = 5173;
const io = new Server<ClientToServerEvents, ServerToClientEvents>(port, {
    cors: {
        origin: [`http://127.0.0.1:${clientPort}`, `http://localhost:${clientPort}`, `http://192.168.1.90:${clientPort}`, `http://192.168.231.1:${clientPort}`],
        // origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const games: Map<string, Game> = new Map();


// Ensure user has a playerId. If not, set a Set-Cookie header
io.engine.on("headers", (headers, request) => {
    const cookies = parse(request.headers.cookie || '');
    if (!cookies.playerId) {
        const playerId: string = generateUUID();
        headers["set-cookie"] = serialize("playerId", playerId, {
            httpOnly: true,
            path: '/',
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 30,
        });
        // cookies.playerId = playerId;
        request.headers.cookie += "; playerId=" + playerId;
    }
})

io.on("connection", (socket) => {
    const cookies = parse(socket.handshake.headers.cookie || '');
    const playerId = cookies.playerId || generateUUID();
    console.log("User connected:", playerId);
    socket.join(playerId);

    function sendGameState(game: string): void;
    function sendGameState(game: Game): void;
    function sendGameState(game: string | Game): void {
        if (typeof game === "string") {
            const gameObj = games.get(game);
            if (!gameObj) return;
            io.to(game).emit("gameState", gameObj.getState());
        } else {
            io.to(game.gameId).emit("gameState", game.getState());
        }
    }

    socket.on("createGame", (color, callback) => {
        let gameId = generateGameId(6);
        while (games.get(gameId))
            gameId = Math.random().toString(36).substring(2, 8);
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
        sendGameState(game);
        callback({ status: AckStatus.OK, message: "Successfully created game", gameId: gameId });


        function generateGameId(len: number) {
            const chars: string = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789";
            let result: string = "";
            for (let i=0; i < len; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            return result;
        }
    })

    socket.on("joinGame", (gameId, callback) => {
        // gameId = gameId.toUpperCase();
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
            sendGameState(game);
            sendAllPlayerStates(gameId);
            callback({ status: AckStatus.OK, message: "Successfully rejoined game" });
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
        sendGameState(game);
        sendAllPlayerStates(gameId);
        callback({ status: AckStatus.OK, message: "Successfully joined game" });
        console.log(game.players);


        function sendAllPlayerStates(gameId: string) {
            const game = games.get(gameId);
            if (!game) return;

            for (const player of game.players) {
                io.to(player.playerId).emit("playerState", player.getState());
            }
        }
    })


    socket.on("move", (gameId, move, callback) => {
        console.log("Received move:");
        console.log(move);
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to make move: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING) {
            console.log("Unable to make move: game is not running");
            callback({ status: AckStatus.ERROR, message: "Game not running" });
            return;
        }

        // Player is in the game
        const player = game.getPlayer(playerId);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Invalid player"});
            return;
        }

        // It's the players turn
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
        sendGameState(game);
        callback({ status: AckStatus.OK, message: "Successfully made move" });

    })


    socket.on("callBluff", (gameId, callback) => {
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to make move: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING) {
            console.log("Unable to make move: game is not running");
            callback({ status: AckStatus.ERROR, message: "Game not running" });
            return;
        }

        // Player is in the game
        const player = game.getPlayer(playerId);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Invalid player"});
            return;
        }

        // It's the players turn
        if (player.color !== game.turnColor) {
            callback({ status: AckStatus.ERROR, message: "Not players turn"});
            return;
        }

        // Able to call bluff
        if (game.prevBoard === null) {
            callback({ status: AckStatus.ERROR, message: "Unable to call bluff"});
            return;
        }

        if (game.lastMoveWasBluff) {
            // Successful call
            game.board = game.prevBoard;
            game.prevBoard = null;
            game.board.enPassant = null;
            sendGameState(game);
            callback({ status: AckStatus.OK, message: "Successfully called bluff", result: true });
            return;
        } else {
            // Failed call
            game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
            game.board.enPassant = null;
            sendGameState(game);
            callback({ status: AckStatus.OK, message: "Failed to call bluff", result: false });
            return;
        }
    })

    socket.on("disconnect", () => {
        console.log("User disconnected:", playerId);
        // TODO: Check if both users disconnected and end/remove game
    });


});


function generateUUID() {
    return crypto.randomUUID?.() ?? uuidv4();
}

console.log(`Server started on port ${port}`);