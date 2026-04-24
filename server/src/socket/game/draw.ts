import type {Server, Socket} from "socket.io";
import type {
    GameDrawAcceptRequest, GameDrawCancelledResponse,
    GameDrawCancelOfferRequest,
    GameDrawDeclineRequest,
    GameDrawOfferRequest
} from "@common/src/index.js";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";
import {
    GameDrawAcceptSchema,
    GameDrawCancelOfferSchema, type GameDrawDeclinedResponse, GameDrawDeclineSchema,
    type GameDrawOfferedResponse,
    GameDrawOfferSchema,
    GameResult,
    GameStatus,
    type GenericCallback
} from "@chess-bs/common";

export default function drawHandler(io: Server) {

    function offerDraw(this: Socket, payload: GameDrawOfferRequest, callback: GenericCallback) {
        const parsed: GameDrawOfferRequest = validateSocketPayload(payload, GameDrawOfferSchema, "game:draw:offer");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Game not running");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }

        if (game.drawOfferedColor && game.drawOfferedColor !== player.color) {
            callback(true, "Draw Offered");
            game.endGame(GameResult.Draw, "Both players accepted a draw")
            return;
        }

        game.drawOfferedColor = player.color;

        const drawOfferedPayload: GameDrawOfferedResponse = {
            offeredBy: player.color,
        }
        this.to(gameId).emit("game:draw:offered", drawOfferedPayload);
        callback(true, "Draw Offered");
    }

    function cancelDraw(this: Socket, payload: GameDrawCancelOfferRequest, callback: GenericCallback) {
        const parsed: GameDrawCancelOfferRequest = validateSocketPayload(payload, GameDrawCancelOfferSchema, "game:draw:cancel-offer");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Game not running");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.drawOfferedColor === null || game.drawOfferedColor !== player.color) {
            callback(false, "Failed to cancel draw offer");
            return;
        }


        game.drawOfferedColor = null;
        callback(true, "Draw offer cancelled");

        const drawOfferCancelledPayload: GameDrawCancelledResponse = {

        }
        io.to(gameId).emit("game:draw:cancelled", drawOfferCancelledPayload);

    }

    function acceptDraw(this: Socket, payload: GameDrawAcceptRequest, callback: GenericCallback) {
        const parsed: GameDrawAcceptRequest = validateSocketPayload(payload, GameDrawAcceptSchema, "game:draw:accept");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Game not running");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.drawOfferedColor === null || game.drawOfferedColor === player.color) {
            callback(false, "Failed to accept draw");
            return;
        }

        callback(true, "Draw accepted");
        game.endGame(GameResult.Draw, "Both players accepted a draw");

    }

    function declineDraw(this: Socket, payload: GameDrawDeclineRequest, callback: GenericCallback) {
        const parsed: GameDrawDeclineRequest = validateSocketPayload(payload, GameDrawDeclineSchema, "game:draw:decline");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        // Game is running
        if (game.gameStatus !== GameStatus.RUNNING && game.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) {
            callback(false, "Game not running");
            return;
        }

        const player = game.getPlayer(user.id);

        // Player is in the game
        if (!player) {
            callback(false, "Player not in match");
            return;
        }


        if (game.drawOfferedColor === null || game.drawOfferedColor === player.color) {
            callback(false, "Failed to decline draw");
            return;
        }

        callback(true, "Draw declined");
        game.drawOfferedColor = null;
        const drawOfferDeclinedPayload: GameDrawDeclinedResponse = {

        }
        io.to(gameId).emit("game:draw:declined", drawOfferDeclinedPayload);
    }


    return {
        offerDraw,
        cancelDraw,
        acceptDraw,
        declineDraw
    }
}