// import {v4 as uuidv4} from "uuid";
// import {
//     AckStatus,
//     BluffPunishment, type CallBluff,
//     type ClientToServerEvents, Color,
//     CreateGameColor, GameResult, GameStatus, type Move,
//     type Rule as RuleType,
//     type ServerToClientEvents
// } from "@common/src/index.js";
// import {Server} from "socket.io";
// import type {InMemoryGameRepository} from "./game.repository.js";
// import {generateGameId, generateUUID, getMoveNotation} from "./helper.js";
// import {parse, serialize} from "cookie";
// import Game from "./game.js";
// import {gameRepository, io} from "./server.js";
// import {getFinishedGameById, saveFinishedGame} from "./db/helper.js";
// import type { Socket } from "socket.io";
// import Rule from "@common/src/rule.js";
// import {callBluffSchema, chatMessageSchema, gameJoinSchema, moveSchema} from "@common/src/schemas/socket.js";
//
// type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;
//
// function handleCreateGame(socket: SocketType, color: CreateGameColor, timeControlStartSeconds: number | null, timeControlIncrementSeconds: number | null, bluffPunishment: BluffPunishment, ruleCount: number, rulePool: Rule[],
//                                 callback: (
//     {status, message, gameId}:
//     {status: AckStatus, message: string, gameId?: string}) => void): void {
//
//     const playerId = socket.data.playerId;
//     let gameId = generateGameId(6);
//     while (gameRepository.getById(gameId))
//         gameId = Math.random().toString(36).substring(2, 8);
//     const game = new Game(gameId, ruleCount, rulePool.map(r => Rule.from(r)).filter(r => r !== undefined), bluffPunishment, timeControlStartSeconds !== null ? timeControlStartSeconds * 1000 : null, timeControlIncrementSeconds !== null ? timeControlIncrementSeconds * 1000 : null);
//
//     gameRepository.save(game);
//     console.log(`Creating game ${gameId} for player ${playerId} with options: Color: ${color}, timeStart: ${timeControlStartSeconds} * 1000, timeIncrement: ${timeControlIncrementSeconds} * 1000, bluffPunishment: ${bluffPunishment}, ruleCount: ${ruleCount}, rulePool: ${JSON.stringify(rulePool.map(r => r.name))}`);
//     callback({ status: AckStatus.OK, message: "Successfully created game", gameId: gameId });
//
// }
//
//
// function handleJoinGame(socket: SocketType, gameId: string, callback: ({status, message}: {status: AckStatus, message: string}) => void): void {
//     const playerId = socket.data.playerId;
//
//     // Check if it is a past game
//     const finishedGame = await getFinishedGameById(gameId);
//     if (finishedGame) {
//         io.to(playerId).emit("replayInfo", finishedGame);
//         callback({ status: AckStatus.OK, message: "Successfully sent game replay"});
//         return;
//     }
//
//     // Check if it's a running game
//     const game = gameRepository.getById(gameId);
//     if (!game) {
//         console.log("Unable to join game: game not found");
//         callback({ status: AckStatus.ERROR, message: "Game not found" });
//         return;
//     }
//
//     // Rejoining game
//     let player = game.getPlayer(playerId);
//     if (player) {
//         console.log("Player rejoining game")
//         const gameState = game.getState();
//         if (!gameState) {
//             callback({ status: AckStatus.ERROR, message: "Unable to rejoin game" });
//             return;
//         }
//         socket.join(gameId);
//         sendAllPlayerStates(gameId);
//         sendGameInfo(game);
//         sendGameState(game);
//         callback({ status: AckStatus.OK, message: "Successfully rejoined game" });
//         return;
//     }
//
//     // New Player
//     // const newPlayerColor = game.creatorPlayerId === playerId
//     //     ? game.creatorColor === CreateGameColor.White
//     //         ? Color.White
//     //         : game.creatorColor === CreateGameColor.Black
//     //             ? Color.Black
//     //             : undefined
//     //     : undefined
//     player = game.addPlayer(playerId, newPlayerColor);
//     if (!player) {
//         callback({ status: AckStatus.ERROR, message: "Game is full" });
//         return;
//     }
//
//     console.log(`Joining game ${gameId} for player ${playerId}`);
//     socket.join(gameId);
//     sendGameInfo(game);
//     sendGameState(game);
//     sendAllPlayerStates(gameId);
//     callback({ status: AckStatus.OK, message: "Successfully joined game" });
//
//
//     function sendAllPlayerStates(gameId: string) {
//         const game = gameRepository.getById(gameId);
//         if (!game) return;
//
//         for (const player of game.players) {
//             io.to(player.userId).emit("playerState", player.getState());
//         }
//     }
// }
//
// function handleMove(socket: SocketType, gameId: string, move: Move, callback: ({status, message}: {status: AckStatus, message: string}) => void): void {
//     const playerId = socket.data.playerId;
//     const game = gameRepository.getById(gameId);
//
//     if (!game) {
//         console.log("Unable to make move: game not found");
//         callback({ status: AckStatus.ERROR, message: "Game not found" });
//         return;
//     }
//
//     // Game is running
//     if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
//         console.log("Unable to make move: game is not running");
//         callback({ status: AckStatus.ERROR, message: "Game not running" });
//         return;
//     }
//
//     // Player is in the game
//     const player = game.getPlayer(playerId);
//     if (!player) {
//         callback({ status: AckStatus.ERROR, message: "Invalid player"});
//         return;
//     }
//
//     // It's the players turn
//     // TODO: Uncomment
//     if (player.color !== game.turnColor) {
//         callback({ status: AckStatus.ERROR, message: "Not players turn"});
//         return;
//     }
//
//
//     move.notation = getMoveNotation(game.currentBoard, move);
//     if (!game.makeMove(move, player)) {
//         callback({ status: AckStatus.ERROR, message: "Failed to make move"});
//         return;
//     }
//
//     // Add Increment
//     if (game.usesTimer) {
//         game.timeLeftMs.set(game.turnColor, (game.timeLeftMs.get(game.turnColor) || 0) + game.timerIncrementMs);
//         game.hasMoved.set(game.turnColor, true);
//
//         // Start the timer if each player has made a move
//         if (game.gameStatus === GameStatus.WAITING_FOR_FIRST_MOVE && Array.from(game.hasMoved.values()).every(v => v)) {
//             console.log("starting timer")
//             game.startGameTimer();
//         }
//     }
//
//     // Change turn
//     game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
//     sendGameState(game);
//
//     // Check for a "checkmate"/win
//     for (const player of game.players) {
//         const playerColor = player.color;
//         const oppColor = player.color === Color.White ? Color.Black : Color.White;
//         if (game.currentBoard.findKing(playerColor) === null) {
//             console.log(`${game.gameId}: ${playerColor} king missing.\n\t${game.turnColor == oppColor}\n\t${game.turnColor == playerColor && !game.lastMoveWasBluff}`)
//             if (game.turnColor === oppColor || (game.turnColor === playerColor && !game.lastMoveWasBluff)) {
//                 game.endGame(oppColor === Color.Black ? GameResult.Black : GameResult.White, "King captured");
//             }
//         }
//     }
//
//     callback({ status: AckStatus.OK, message: "Successfully made move" });
// }
//
// function handleCallBluff(socket: SocketType, gameId: string, callback: ({status, message}: {status: AckStatus, message: string, result?: boolean}) => void): void {
//     const playerId = socket.data.playerId;
//     const game = gameRepository.getById(gameId);
//
//     if (!game) {
//         console.log("Unable to make move: game not found");
//         callback({ status: AckStatus.ERROR, message: "Game not found" });
//         return;
//     }
//
//     // Game is running
//     if (game.gameStatus !== GameStatus.RUNNING) {
//         console.log("Unable to make move: game is not running");
//         callback({ status: AckStatus.ERROR, message: "Game not running" });
//         return;
//     }
//
//     // Player is in the game
//     const player = game.getPlayer(playerId);
//     if (!player) {
//         callback({ status: AckStatus.ERROR, message: "Invalid player"});
//         return;
//     }
//
//     // It's the players turn
//     if (player.color !== game.turnColor) {
//         callback({ status: AckStatus.ERROR, message: "Not players turn"});
//         return;
//     }
//
//     // Able to call bluff
//     const prevTurn = game.turnHistory[game.turnHistory.length-1]
//     if (!(prevTurn && 'from' in prevTurn && prevTurn.piece?.color !== game.turnColor) || game.prevBoard === null) {
//         callback({ status: AckStatus.ERROR, message: "Unable to call bluff"});
//         return;
//     }
//
//     if (game.lastMoveWasBluff) {
//         // Successful call
//         game.currentBoard = game.prevBoard;
//         game.prevBoard = null;
//         game.currentBoard.enPassant = null;
//         game.turnHistory.push({successful: true, callerColor: player.color, timestamp: Date.now()} as CallBluff)
//         sendGameState(game);
//         callback({ status: AckStatus.OK, message: "Successfully called bluff", result: true });
//         return;
//     } else {
//         // Failed call
//         game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
//         game.currentBoard.enPassant = null;
//         game.turnHistory.push({successful: false, callerColor: player.color, timestamp: Date.now()} as CallBluff)
//         sendGameState(game);
//         callback({ status: AckStatus.OK, message: "Failed to call bluff", result: false });
//         return;
//     }
// }
//
// function handleRematch(socket: SocketType, gameId: string, callback: ({status, message}: {status: AckStatus, message: string}) => void): void {
//     const playerId = socket.data.playerId;
//
//     const game = gameRepository.getById(gameId);
//     if (!game) {
//         console.log("Chat message received in non-existent game:", gameId);
//         callback({status: AckStatus.ERROR, message: "Game not found"});
//         return;
//     }
//
//     if (game.gameStatus !== GameStatus.DONE) {
//         console.log("Rematch request for non-finished game:", gameId);
//         callback({status: AckStatus.ERROR, message: "Game not finished"});
//         return;
//     }
//
//     const player = game.getPlayer(playerId);
//     if (!player) {
//         callback({ status: AckStatus.ERROR, message: "Invalid player"});
//         return;
//     }
//
//     // const rematchRequest = rematchRequests.get(gameId);
//     //
//     // if (rematchRequest) {
//     //     if (rematchRequest === player.color) {
//     //         callback({ status: AckStatus.ERROR, message: "Rematch request already submitted"})
//     //         return;
//     //     }
//     //
//     //     let gameId = generateGameId(6);
//     //     while (games.get(gameId))
//     //         gameId = Math.random().toString(36).substring(2, 8);
//     //     const game = new Game(gameId, playerId, color, ruleCount, rulePool.map(r => Rule.from(r)).filter(r => r !== undefined), bluffPunishment, timeControlStartSeconds !== null ? timeControlStartSeconds * 1000 : null, timeControlIncrementSeconds !== null ? timeControlIncrementSeconds * 1000 : null);
//     //
//     //     games.set(gameId, game);
//     //
//     //     socket.to(gameId).emit("gameRedirect", )
//     // } else {
//     //     rematchRequests.set(gameId, player.color);
//     // }
// }
//
// function handleDisconnect(socket: SocketType): void {
//     const playerId = socket.data.playerId;
//     console.log("User disconnected:", playerId);
//     // TODO: Check if both users disconnected and end/remove game
// }
//
// function sendGameState(game: string | Game): void {
//     if (typeof game === "string") {
//         const gameObj = gameRepository.getById(game);
//         if (!gameObj) return;
//         io.to(game).emit("gameState", gameObj.getState());
//     } else {
//         io.to(game.gameId).emit("gameState", game.getState());
//     }
// }
//
// function sendGameInfo(game: string | Game): void {
//     if (typeof game === "string") {
//         const gameObj = gameRepository.getById(game);
//         if (!gameObj) return;
//         io.to(game).emit("gameInfo", gameObj.getInfo());
//     } else {
//         io.to(game.gameId).emit("gameInfo", game.getInfo());
//     }
// }
//
//
//
//
//
//
// export function createSocketHandlers() {
//
//     // Ensure user has a playerId. If not, set a Set-Cookie header
//     io.engine.on("headers", (headers, request) => {
//         const cookies = parse(request.headers.cookie || '');
//         if (!cookies.playerId) {
//             const playerId: string = generateUUID();
//             headers["set-cookie"] = serialize("playerId", playerId, {
//                 httpOnly: true,
//                 path: '/',
//                 sameSite: "lax",
//                 maxAge: 60 * 60 * 24 * 365 * 5,
//             });
//             request.headers.cookie += "; playerId=" + playerId;
//         }
//     })
//
//     io.use((socket, next) => {
//         const cookies = parse(socket.handshake.headers.cookie || '');
//         const playerId = cookies.playerId || generateUUID();
//
//         socket.data.playerId = playerId;
//         // TODO: change to sessions/tokens, and attack session.user to socket instead of playerId
//
//         next();
//     })
//
//     io.on("connection", (socket) => {
//         const { playerId } = socket.data;
//         console.log("User connected:", playerId);
//
//         socket.join(playerId);
//
//         socket.on("createGame",(color,
//                                 timeControlStartSeconds,
//                                 timeControlIncrementSeconds,
//                                 bluffPunishment,
//                                 ruleCount,
//                                 rulePool,
//                                 callback) =>
//         { handleCreateGame(socket, color, timeControlStartSeconds, timeControlIncrementSeconds, bluffPunishment, ruleCount, rulePool, callback); });
//
//         socket.on("joinGame", (gameId, callback) =>
//         {
//             if (!(typeof callback === "function")) {
//                 console.warn("joinGame: socket handler received non-function callback")
//                 return;
//             }
//             const parseResult = gameJoinSchema.safeParse({
//                 gameId
//             });
//
//             if (!parseResult.success) {
//                 console.warn("joinGame: socket payload validation failed: ", parseResult.error);
//                 return;
//             }
//
//             handleJoinGame(socket, gameId, callback);
//         });
//
//         socket.on("move", (gameId, move, callback) => {
//             if (!(typeof callback === "function")) {
//                 console.warn("move: socket handler received non-function callback")
//                 return;
//             }
//             const parseResult = moveSchema.safeParse({
//                 gameId,
//                 move
//             });
//
//             if (!parseResult.success) {
//                 console.warn("move: socket payload validation failed: ", parseResult.error);
//                 return;
//             }
//
//             handleMove(socket, gameId, move, callback);
//         });
//
//         socket.on("callBluff", (gameId, callback) => {
//             if (!(typeof callback === "function")) {
//                 console.warn("callBluff: socket handler received non-function callback")
//                 return;
//             }
//             const parseResult = callBluffSchema.safeParse({
//                 gameId
//             });
//
//             if (!parseResult.success) {
//                 console.warn("callBluff: socket payload validation failed: ", parseResult.error);
//                 return;
//             }
//
//             handleCallBluff(socket, gameId, callback);
//         });
//
//         socket.on("chatMessage", (gameId, message ) => {
//             const parseResult = chatMessageSchema.safeParse({
//                 gameId,
//                 message
//             });
//
//             if (!parseResult.success) {
//                 console.warn("chatMessage: socket payload validation failed: ", parseResult.error);
//                 return;
//             }
//
//             handleChatMessage(socket, gameId, message);
//         });
//
//         socket.on("rematch", (gameId, callback) => {
//             // TODO: Add zod payload validation
//
//             handleRematch(socket, gameId, callback);
//         });
//
//         socket.on("disconnect", () => { handleDisconnect(socket); });
//
//
//     });
// }
//
//
