import type {Server, Socket} from "socket.io";
import {
    BluffPunishment,
    Color,
    type GameChatSystemResponse,
    type GameMoveAppliedResponse,
    type GameMoveBluffCallRequest,
    GameMoveBluffCallSchema,
    type GameMoveBluffChoosePieceRequest,
    type GameMoveSendRequest,
    GameMoveSendSchema,
    GameResult,
    GameStatus,
    type GenericCallback,
    getMoveNotation
} from "@chess-bs/common";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";
import {handleBotMove, isBotGame} from "./bot.js";

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

        delete move.bluff;
        const movePayload: GameMoveAppliedResponse = {
            move: move,
            turnColor: game.turnColor,
            appliedAt: receivedAt,
        }

        // Send move and a true callback
        this.to(gameId).emit("game:move:applied", movePayload);
        callback(true, "Move applied", receivedAt);

        // Check for a "checkmate"/win
        const checkmatedColor = game.isInCheckmate();
        if (checkmatedColor) {
            game.endGame(checkmatedColor === Color.White ? GameResult.Black : GameResult.White, "King captured");
        }


        // Handle Bot move in bot games
        if (isBotGame(game)) handleBotMove(game);

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
            io.to(gameId).emit("game:chat:system", ({message: `${player.color} successfully called bluff`}) as GameChatSystemResponse);
            return;
        } else {
            io.to(gameId).emit("game:move:bluff:call-failed", response);
            callback(true, message);
            io.to(gameId).emit("game:chat:system", ({message: `${player.color}'s bluff call was incorrect`}) as GameChatSystemResponse);
            if (isBotGame(game) && game.bluffPunishment === BluffPunishment.Turn) handleBotMove(game);
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