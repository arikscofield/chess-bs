import type {Server, Socket} from "socket.io";
import type {
    GameRematchAcceptRequest, GameRematchCancelledResponse,
    GameRematchCancelOfferRequest, GameRematchDeclineRequest,
    GameRematchOfferRequest
} from "@common/src/index.js";
import {
    GameRematchAcceptSchema,
    GameRematchCanceledSchema, GameRematchCancelOfferSchema, type GameRematchDeclinedResponse,
    GameRematchDeclineSchema, type GameRematchOfferedResponse,
    GameRematchOfferSchema,
    GameStatus,
    type GenericCallback
} from "@chess-bs/common";
import {handleRematch, validateSocketPayload} from "../index.js";
import {gameRepository} from "../../server.js";
import type {User} from "../../db/schema.js";

export default function rematchHandler(io: Server) {

    function offerRematch(this: Socket, payload: GameRematchOfferRequest, callback: GenericCallback) {
        const parsed: GameRematchOfferRequest = validateSocketPayload(payload, GameRematchOfferSchema, "game:rematch:offer");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is over
        if (game.gameStatus !== GameStatus.DONE) {
            callback(false, "Game is not done");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }

        if (game.rematchOfferedColor && game.rematchOfferedColor !== player.color) {
            callback(true, "Rematch offered and accepted");
            handleRematch(game);
            return;
        }

        game.rematchOfferedColor = player.color;

        const rematchOfferedPayload: GameRematchOfferedResponse = {
            offeredBy: player.color,
        }
        this.to(gameId).emit("game:rematch:offered", rematchOfferedPayload);
        callback(true, "Rematch Offered");
    }

    function cancelRematch(this: Socket, payload: GameRematchCancelOfferRequest, callback: GenericCallback) {
        const parsed: GameRematchCancelOfferRequest = validateSocketPayload(payload, GameRematchCancelOfferSchema, "game:rematch:cancel-offer");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.DONE) {
            callback(false, "Game is not done");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.rematchOfferedColor === null || game.rematchOfferedColor !== player.color) {
            callback(false, "Failed to cancel rematch offer");
            return;
        }


        game.rematchOfferedColor = null;
        callback(true, "Rematch offer cancelled");

        const rematchOfferCancelledPayload: GameRematchCancelledResponse = {

        }
        io.to(gameId).emit("game:rematch:cancelled", rematchOfferCancelledPayload);
    }

    function acceptRematch(this: Socket, payload: GameRematchAcceptRequest, callback: GenericCallback) {
        const parsed: GameRematchAcceptRequest = validateSocketPayload(payload, GameRematchAcceptSchema, "game:rematch:accept");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is Done
        if (game.gameStatus !== GameStatus.DONE ) {
            callback(false, "Game is not done");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.rematchOfferedColor === null || game.rematchOfferedColor === player.color) {
            callback(false, "Failed to accept rematch");
            return;
        }

        callback(true, "Rematch accepted");
        handleRematch(game);
    }

    function declineRematch(this: Socket, payload: GameRematchDeclineRequest, callback: GenericCallback) {
        const parsed: GameRematchDeclineRequest = validateSocketPayload(payload, GameRematchDeclineSchema, "game:rematch:decline");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.DONE) {
            callback(false, "Game is not done");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.rematchOfferedColor === null || game.rematchOfferedColor === player.color) {
            callback(false, "Failed to decline rematch");
            return;
        }

        callback(true, "Rematch declined");
        const rematchOfferDeclinedPayload: GameRematchDeclinedResponse = {

        }
        io.to(gameId).emit("game:rematch:declined", rematchOfferDeclinedPayload);
    }


    return {
        offerRematch,
        cancelRematch,
        acceptRematch,
        declineRematch,
    }
}