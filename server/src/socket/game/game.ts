import type {Server, Socket} from "socket.io";
import {
    Color,
    type GameJoinRequest, GameJoinSchema, type GamePlayerJoinedResponse,
    type GameRequestStateRequest, GameRequestStateSchema,
    type GameResignRequest, GameResignSchema, GameResult,
    type GameSpectateRequest, GameSpectateSchema, type GameStateResponse, GameStatus, type GenericCallback
} from "@common/src/index.js";
import {validateSocketPayload} from "../index.js";
import type {User} from "../../db/schema.js";
import {gameRepository} from "../../server.js";
import type {GamePlayerStateResponse, GameStartedResponse} from "@chess-bs/common";



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

        // Rejoining
        if (player) {
            console.log(`User: ${user.username} rejoining match: ${gameId}`)
            this.join(gameId);

            const playerStatePayload: GamePlayerStateResponse = {
                userId: player.userId,
                username: player.username,
                color: player.color,
                ruleIds: player.rules.map(rule => rule.id),
                clockMs: game.clockStartMs
            }
            this.emit("game:player:state", playerStatePayload);

            const state: GameStateResponse = game.getState();
            const playerJoined: GamePlayerJoinedResponse = {
                userId: user.id,
                username: user.username,
            }
            this.to(gameId).emit("game:player:joined", playerJoined)

            callback(true, "Successfully rejoined game", state);
            return;
        }

        if (game.gameStatus !== GameStatus.WAITING_FOR_PLAYER || game.players.length >= game.maxPlayers) {
            callback(false, "Cannot join game");
            return;
        }


        player = game.addPlayer(user.id, undefined, user.username);

        if (!player) {
            callback(false, "Cannot join game");
            return;
        }

        console.log(`User ${user.username} first time joining: ${gameId}`);
        this.join(gameId);

        const state: GameStateResponse = game.getState();
        const playerJoined: GamePlayerJoinedResponse = {
            userId: user.id,
            username: user.username,
        }
        this.to(gameId).emit("game:player:joined", playerJoined)

        callback(true, "Successfully joined game", state);



        if (game.players.length >= game.maxPlayers) {
            const sockets = await io.in(gameId).fetchSockets();

            for (const socket of sockets) {
                const player = game.players.find(player => player.userId === socket.data.user.id)
                if (!player) break;
                const playerStatePayload: GamePlayerStateResponse = {
                    userId: player.userId,
                    username: player.username,
                    color: player.color,
                    ruleIds: player.rules.map(rule => rule.id),
                    clockMs: game.clockStartMs
                }
                socket.emit("game:player:state", playerStatePayload);
            }

            const gameStartedPayload: GameStartedResponse = {
                gameStatus: game.gameStatus,
                startedAt: Date.now(),
            }
            io.to(gameId).emit("game:started", gameStartedPayload);
        }
        return;
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

        const state: GameStateResponse = game.getState();
        this.emit("game:state", state);

        const player = game.players.find(player => player.userId === this.data.user.id)
        if (!player) {
            callback(false, "Cannot find player state");
            return;
        }
        const playerStatePayload: GamePlayerStateResponse = {
            userId: player.userId,
            username: player.username,
            color: player.color,
            ruleIds: player.rules.map(rule => rule.id),
            clockMs: game.clockStartMs
        }
        this.emit("game:player:state", playerStatePayload);


        callback(true, "Successfully sent game and player state");
        return;

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

        callback(true, "Successfully resigned from game");
        return;
    }


    return {
        joinGame,
        spectateGame,
        getState,
        resign
    }
}