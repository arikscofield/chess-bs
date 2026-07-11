import type {Server, Socket} from "socket.io";
import {
    Color, type GameChatSystemResponse,
    type GameJoinRequest, GameJoinSchema, type GamePlayerJoinedResponse,
    type GameRequestStateRequest, GameRequestStateSchema,
    type GameResignRequest, GameResignSchema, GameResult,
    type GameSpectateRequest, GameSpectateSchema, type GameStateResponse, GameStatus, type GenericCallback,
    type GameDisconnectRequest, GameDisconnectSchema,
} from "@chess-bs/common";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";
import {sendGameStart} from "../events.js";



export default function gameHandler(io: Server) {

    async function joinGame(this: Socket, payload: GameJoinRequest, callback: GenericCallback) {
        const parsed: GameJoinRequest = validateSocketPayload(payload, GameJoinSchema, "game:join");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        let player = game.getPlayer(user.id);
        const isRejoining = player !== null;

        if (!isRejoining) {
            if (game.gameStatus !== GameStatus.WAITING_FOR_PLAYER || game.players.length >= game.maxPlayers) {
                callback(false, "Cannot join game");
                return;
            }
            player = game.addPlayer(user.id, undefined, user.username);
            if (!player) {
                callback(false, "Cannot join game");
                return;
            }
        }

        console.log(`User: ${user.username} ${isRejoining ? "rejoining" : "joining"} match: ${gameId}`)
        this.join(gameId);
        game.playerConnect(user.id, this.id);

        this.to(gameId).emit("game:player:joined", {
            userId: user.id,
            username: user.username,
        } as GamePlayerJoinedResponse)
        this.emit("game:player:state", player?.getState());

        callback(true, isRejoining? "Successfully rejoined game" : "Successfully joined game", game.getState());

        if (!isRejoining && game.players.length >= game.maxPlayers) {
            await sendGameStart(game);
        }
    }

    function spectateGame(this: Socket, payload: GameSpectateRequest, callback: GenericCallback) {
        const parsed: GameSpectateRequest = validateSocketPayload(payload, GameSpectateSchema, "game:spectate");
        const { gameId } = parsed;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        this.join(gameId);
        const state: GameStateResponse = game.getState();
        callback(true, "Successfully joined game", state);
        return;
    }

    function getState(this: Socket, payload: GameRequestStateRequest, callback: GenericCallback) {
        const parsed: GameRequestStateRequest = validateSocketPayload(payload, GameRequestStateSchema, "game:request-state");
        const { gameId } = parsed;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        this.emit("game:state", game.getState());

        const player = game.players.find(player => player.userId === this.data.user.id)
        if (!player) {
            callback(false, "Cannot find player state");
            return;
        }
        this.emit("game:player:state", player.getState());

        callback(true, "Successfully sent game and player state");
    }

    function resign(this: Socket, payload: GameResignRequest, callback: GenericCallback) {
        const parsed: GameResignRequest = validateSocketPayload(payload, GameResignSchema, "game:resign");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        const player = game.getPlayer(user.id);

        if (!player) {
            callback(false, "Cannot resign from game");
            return;
        }

        const winner = player.color === Color.White ? GameResult.Black : GameResult.White;

        if (!game.endGame(winner, `${player.color} resigned`)) {
            callback(false, "Cannot resign from game");
            return;
        }

        io.to(gameId).emit("game:chat:system", ({message: `${player.color} resigned`}) as GameChatSystemResponse);
        callback(true, "Successfully resigned from game");
        return;
    }

    function disconnect(this: Socket, payload: GameDisconnectRequest, callback: GenericCallback) {
        const parsed: GameDisconnectRequest = validateSocketPayload(payload, GameDisconnectSchema, "game:disconnect");
        const { gameId } = parsed;
        const user: User = this.data.user;
        const game = gameRepository.getById(gameId);

        this.leave(gameId);

        if (!game) {
            callback(false, "Game not found");
            return;
        }

        if (game.getPlayer(user.id)) {
            game.playerDisconnect(user.id, this.id);
        } else {
            // TODO: remove spectators
        }

        callback(true, "Successfully disconnected from game");
    }

    return {
        joinGame,
        spectateGame,
        getState,
        resign,
        disconnect,
    }
}