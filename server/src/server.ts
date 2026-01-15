import {Server} from "socket.io";
import Game from "./game.js";
import {
    AckStatus,
    type CallBluff,
    type ClientToServerEvents,
    Color,
    CreateGameColor,
    GameResult,
    GameStatus,
    type ServerToClientEvents,
} from "@common/src/index.js";
import {parse, serialize} from "cookie";
import {v4 as uuidv4} from 'uuid'
import Rule from "@common/src/rule.js";
import 'dotenv/config';


import {Redis} from "ioredis";
// import {getMoveNotation} from "@common/src/helper.js";
import {getMoveNotation} from "./helper.js";
import {getFinishedGameFromId, saveFinishedGame} from "./db/helper.js";


const port = parseInt(process.env.PORT || "3000");
const clientPort = parseInt(process.env.CLIENT_PORT || "5173");

// TODO: Fix hard coded-ips
const io = new Server<ClientToServerEvents, ServerToClientEvents>(port, {
    cors: {
        origin: [`http://localhost:${clientPort}`, `http://192.168.1.201:${clientPort}`],
        methods: ["GET", "POST"],
        credentials: true,
    },
});



const games: Map<string, Game> = new Map();

const redis = new Redis();


function sendGameState(game: string | Game): void {
    if (typeof game === "string") {
        const gameObj = games.get(game);
        if (!gameObj) return;
        io.to(game).emit("gameState", gameObj.getState());
    } else {
        io.to(game.gameId).emit("gameState", game.getState());
    }
}

function sendGameInfo(game: string | Game): void {
    if (typeof game === "string") {
        const gameObj = games.get(game);
        if (!gameObj) return;
        io.to(game).emit("gameInfo", gameObj.getInfo());
    } else {
        io.to(game.gameId).emit("gameInfo", game.getInfo());
    }
}

export function sendGameOver(game: string | Game, gameResult: GameResult, reason: string): void {
    let gameId: string = "";
    let gameObj: Game | undefined;
    if (typeof game === "string") {
        gameId = game;
        gameObj = games.get(game);
        if (!gameObj) return;
        io.to(game).emit("gameOver", gameResult, reason);
    } else {
        gameId = game.gameId;
        gameObj = game;
        io.to(game.gameId).emit("gameOver", gameResult, reason);
    }

    // Move game to db
    saveFinishedGame(gameObj).then(r => {
        // Delete after 2 minutes to allow for chat messages
        setTimeout(() => {
            games.delete(gameId);
        }, 1000 * 60 * 2)
    });

}

// Ensure user has a playerId. If not, set a Set-Cookie header
io.engine.on("headers", (headers, request) => {
    const cookies = parse(request.headers.cookie || '');
    if (!cookies.playerId) {
        const playerId: string = generateUUID();
        headers["set-cookie"] = serialize("playerId", playerId, {
            httpOnly: true,
            path: '/',
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
        });
        request.headers.cookie += "; playerId=" + playerId;
    }
})

io.on("connection", (socket) => {
    const cookies = parse(socket.handshake.headers.cookie || '');
    const playerId = cookies.playerId || generateUUID();
    console.log("User connected:", playerId);
    socket.join(playerId);



    socket.on("createGame", (color, timeControlStartSeconds, timeControlIncrementSeconds, bluffPunishment, ruleCount, rulePool,  callback) => {
        let gameId = generateGameId(6);
        while (games.get(gameId))
            gameId = Math.random().toString(36).substring(2, 8);
        const game = new Game(gameId, playerId, color, ruleCount, rulePool.map(r => Rule.from(r)).filter(r => r !== undefined), bluffPunishment, timeControlStartSeconds ? timeControlStartSeconds * 1000 : undefined, timeControlIncrementSeconds ? timeControlIncrementSeconds * 1000 : undefined);

        games.set(gameId, game);
        console.log(`Creating game ${gameId} for player ${playerId} with options: Color: ${color}, timeStart: ${timeControlStartSeconds} * 1000, timeIncrement: ${timeControlIncrementSeconds} * 1000, bluffPunishment: ${bluffPunishment}, ruleCount: ${ruleCount}, rulePool: ${JSON.stringify(rulePool.map(r => r.name))}`);
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

    socket.on("joinGame", async (gameId, callback) => {

        // Check if it is a past game
        const finishedGame = await getFinishedGameFromId(gameId);
        if (finishedGame) {
            io.to(playerId).emit("replayInfo", finishedGame);
            callback({ status: AckStatus.OK, message: "Successfully sent game replay"});
            return;
        }

        // Check if it's a running game
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
            sendAllPlayerStates(gameId);
            sendGameInfo(game);
            sendGameState(game);
            callback({ status: AckStatus.OK, message: "Successfully rejoined game" });
            return;
        }

        // New Player
        const newPlayerColor = game.creatorPlayerId === playerId
            ? game.creatorColor === CreateGameColor.White
                ? Color.White
                : game.creatorColor === CreateGameColor.Black
                    ? Color.Black
                    : undefined
            : undefined
        player = game.addPlayer(playerId, newPlayerColor);
        if (!player) {
            callback({ status: AckStatus.ERROR, message: "Game is full" });
            return;
        }

        console.log(`Joining game ${gameId} for player ${playerId}`);
        socket.join(gameId);
        sendGameState(game);
        sendAllPlayerStates(gameId);
        callback({ status: AckStatus.OK, message: "Successfully joined game" });


        function sendAllPlayerStates(gameId: string) {
            const game = games.get(gameId);
            if (!game) return;

            for (const player of game.players) {
                io.to(player.playerId).emit("playerState", player.getState());
            }
        }
    })


    socket.on("move", (gameId, move, callback) => {
        const game = games.get(gameId);
        if (!game) {
            console.log("Unable to make move: game not found");
            callback({ status: AckStatus.ERROR, message: "Game not found" });
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
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


        move.notation = getMoveNotation(game.currentBoard, move);
        if (!game.makeMove(move, player)) {
            callback({ status: AckStatus.ERROR, message: "Failed to make move"});
            return;
        }

        // Add Increment
        if (game.usesTimer) {
            game.timeLeftMs.set(game.turnColor, (game.timeLeftMs.get(game.turnColor) || 0) + game.timeIncrementMs);
            game.hasMoved.set(game.turnColor, true);

            // Start the timer if each player has made a move
            if (game.gameStatus === GameStatus.WAITING_FOR_FIRST_MOVE && Array.from(game.hasMoved.values()).every(v => v)) {
                console.log("starting timer")
                game.startGameTimer();
            }
        }

        // Change turn
        game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
        sendGameState(game);

        // Check for a "checkmate"/win
        for (const player of game.players) {
            const playerColor = player.color;
            const oppColor = player.color === Color.White ? Color.Black : Color.White;
            if (game.currentBoard.findKing(playerColor) === null) {
                console.log(`${game.gameId}: ${playerColor} king missing.\n\t${game.turnColor == oppColor}\n\t${game.turnColor == playerColor && !game.lastMoveWasBluff}`)
                if (game.turnColor === oppColor || (game.turnColor === playerColor && !game.lastMoveWasBluff)) {
                    game.endGame(oppColor === Color.Black ? GameResult.Black : GameResult.White, "King captured");
                }
            }
        }

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
        const prevTurn = game.turnHistory[game.turnHistory.length-1]
        if (!(prevTurn && 'from' in prevTurn && prevTurn.piece?.color !== game.turnColor) || game.prevBoard === null) {
            callback({ status: AckStatus.ERROR, message: "Unable to call bluff"});
            return;
        }

        if (game.lastMoveWasBluff) {
            // Successful call
            game.currentBoard = game.prevBoard;
            game.prevBoard = null;
            game.currentBoard.enPassant = null;
            game.turnHistory.push({successful: true, callerColor: player.color, timestamp: Date.now()} as CallBluff)
            sendGameState(game);
            callback({ status: AckStatus.OK, message: "Successfully called bluff", result: true });
            return;
        } else {
            // Failed call
            game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
            game.currentBoard.enPassant = null;
            game.turnHistory.push({successful: false, callerColor: player.color, timestamp: Date.now()} as CallBluff)
            sendGameState(game);
            callback({ status: AckStatus.OK, message: "Failed to call bluff", result: false });
            return;
        }
    })

    socket.on("chatMessage", (gameId, message) => {
        if (message.length > 200) return;

        const game = games.get(gameId);
        if (!game) {
            console.log("Chat message received in non-existent game:", gameId);
            return;
        }

        socket.to(gameId).emit("chatMessage", message);

    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", playerId);
        // TODO: Check if both users disconnected and end/remove game

    });


});





function generateUUID() {
    return crypto.randomUUID?.() ?? uuidv4();
}


console.log(`Server started on port ${port}`);