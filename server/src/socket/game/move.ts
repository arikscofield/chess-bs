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
        move.timestamp = receivedAt;
        if (!game.makeMove(move, player, receivedAt)) {
            callback(false, "Failed to make move");
            return;
        }

        const movePayload: GameMoveAppliedResponse = {
            move: move,
            turnColor: game.turnColor,
            appliedAt: receivedAt,
        }

        // Check for a "checkmate"/win
        for (const player of game.players) {
            const playerColor = player.color;
            const oppColor = player.color === Color.White ? Color.Black : Color.White;
            if (game.currentBoard.findKing(playerColor) === null) {
                console.log(`${game.gameId}: ${playerColor} king missing.\n\t${game.turnColor == oppColor}\n\t${game.turnColor == playerColor && !game.lastMoveWasBluff}`)
                if (game.turnColor === oppColor || (game.turnColor === playerColor && !game.lastMoveWasBluff)) {
                    callback(true, "Move applied", receivedAt);
                    this.to(gameId).emit("game:move:applied", movePayload);
                    game.endGame(oppColor === Color.Black ? GameResult.Black : GameResult.White, "King captured");
                    return;
                }
            }
        }

        // Send move and a true callback
        this.to(gameId).emit("game:move:applied", movePayload);
        callback(true, "Move applied", receivedAt);

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

        const {ok, callSuccessful, response, message} = game.callBluff(player.color, receivedAt);
        if (!ok) {
            callback(false, message);
            return;
        }

        if (callSuccessful) {
            io.to(gameId).emit("game:move:bluff:call-succeeded", response);
            callback(true, message);
            return;
        } else {
            io.to(gameId).emit("game:move:bluff:call-failed", response);
            callback(true, message);
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