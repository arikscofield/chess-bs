import type {Server, Socket} from "socket.io";
import {
    Color, type GameMoveAppliedResponse,
    type GameMoveBluffCallRequest, type GameMoveBluffCallResultResponse, GameMoveBluffCallSchema,
    type GameMoveBluffChoosePieceRequest,
    type GameMoveSendRequest, GameMoveSendSchema, GameResult,
    GameStatus, type GenericCallback,
    getMoveNotation
} from "@common/src/index.js";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";
import type {CallBluff, GameMoveBluffCallFailedResponse, GameMoveBluffCallSucceededResponse} from "@chess-bs/common";

export default function moveHandler(io: Server) {

    function sendMove(this: Socket, payload: GameMoveSendRequest, callback: GenericCallback) {
        const receivedAt = Date.now();
        const parsed: GameMoveSendRequest = validateSocketPayload(payload, GameMoveSendSchema, "game:move:send");
        const { gameId, move } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Cannot send move");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }

        // Player's turn
        if (player.color !== game.turnColor) {
            callback(false, "Not players turn");
            return;
        }


        move.notation = getMoveNotation(game.currentBoard, move);
        if (!game.makeMove(move, player, receivedAt)) {
            callback(false, "Failed to make move");
            return;
        }



        // Increment
        if (game.usesClock) {
            game.timeLeftMs.set(game.turnColor, (game.timeLeftMs.get(game.turnColor) || 0) + game.clockIncrementMs);
            game.hasMoved.set(game.turnColor, true);

            // Start the timer if each player has made a move
            if (game.gameStatus === GameStatus.WAITING_FOR_FIRST_MOVE && Array.from(game.hasMoved.values()).every(v => v)) {
                game.startGameTimer();
            }
        }


        // Change turn
        game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;

        const movePayload: GameMoveAppliedResponse = {
            move: move,
            appliedAt: receivedAt,
            turnColor: game.turnColor,
        }

        // Check for a "checkmate"/win
        for (const player of game.players) {
            const playerColor = player.color;
            const oppColor = player.color === Color.White ? Color.Black : Color.White;
            if (game.currentBoard.findKing(playerColor) === null) {
                console.log(`${game.gameId}: ${playerColor} king missing.\n\t${game.turnColor == oppColor}\n\t${game.turnColor == playerColor && !game.lastMoveWasBluff}`)
                if (game.turnColor === oppColor || (game.turnColor === playerColor && !game.lastMoveWasBluff)) {
                    callback(true, "Move applied");
                    this.to(gameId).emit("game:move:applied", movePayload);
                    game.endGame(oppColor === Color.Black ? GameResult.Black : GameResult.White, "King captured");
                    return;
                }
            }
        }

        // Send move and a true callback
        this.to(gameId).emit("game:move:applied", movePayload);
        callback(true, "Move applied");

    }

    function callBluff(this: Socket, payload: GameMoveBluffCallRequest, callback: GenericCallback) {
        const receivedAt = Date.now();
        const parsed: GameMoveBluffCallRequest = validateSocketPayload(payload, GameMoveBluffCallSchema, "game:move:bluff:call");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Cannot send bluff call");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }

        // Player's turn
        if (player.color !== game.turnColor) {
            callback(false, "Not players turn");
            return;
        }

        // Able to call bluff
        const prevTurn = game.turnHistory[game.turnHistory.length-1]
        if (!(prevTurn && 'from' in prevTurn && prevTurn.piece?.color !== game.turnColor) || game.prevBoard === null) {
            callback(false, "Unable to call bluff");
            return;
        }

        if (game.lastMoveWasBluff) {
            // Successful call
            const newTurn: CallBluff = {successful: true, callerColor: player.color, timestamp: Date.now()}
            game.currentBoard = game.prevBoard;
            game.prevBoard = null;
            game.currentBoard.enPassant = null;
            game.turnHistory.push(newTurn)
            const responsePayload: GameMoveBluffCallSucceededResponse = {
                appliedAt: receivedAt,
                turnColor: game.turnColor,
                bluffPunishment: game.bluffPunishment,
                punished: game.turnColor === Color.White ? Color.Black : Color.White,
                turn: newTurn,
            }
            io.to(gameId).emit("game:move:bluff:call-succeeded", responsePayload)
            callback(true, "Bluff call correct");
            return;
        } else {
            // Failed call
            const newTurn: CallBluff = {successful: false, callerColor: player.color, timestamp: Date.now()}
            game.turnColor = game.turnColor === Color.White ? Color.Black : Color.White;
            game.currentBoard.enPassant = null;
            game.turnHistory.push(newTurn)
            const responsePayload: GameMoveBluffCallFailedResponse = {
                appliedAt: receivedAt,
                turnColor: game.turnColor,
                bluffPunishment: game.bluffPunishment,
                punished: player.color,
                turn: newTurn,
            }
            io.to(gameId).emit("game:move:bluff:call-failed", responsePayload)
            callback(true, "Bluff call incorrect");
            return;
        }
    }

    function punishmentChoosePiece(this: Socket, payload: GameMoveBluffChoosePieceRequest) {


    }





    return {
        sendMove,
        callBluff,
        punishmentChoosePiece,
    }
}