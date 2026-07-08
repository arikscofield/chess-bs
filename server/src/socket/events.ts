import type Game from "../game.js";
import {
    type GameClockStartedResponse,
    type GameOverResponse, type GamePlayerStateResponse,
    type GameRematchAcceptedResponse,
    GameResult, type GameStartedResponse, type GameStateResponse
} from "@chess-bs/common";
import {gameRepository, io} from "../server.js";
import {saveFinishedGame} from "../db/helper.js";
import {generateGameId} from "../helper.js";


export async function sendGameStart(game: string | Game) {
    if (typeof game === "string") game = gameRepository.getById(game) ?? "";
    if (typeof game === "string") return;

    const sockets = await io.in(game.gameId).fetchSockets();

    // Give each player their state
    for (const socket of sockets) {
        const player = game.players.find(player => player.userId === socket.data.user?.id)
        if (player) socket.emit("game:player:state", player.getState());
    }

    io.to(game.gameId).emit("game:state", game.getState());
    io.to(game.gameId).emit("game:started", {
        gameStatus: game.gameStatus,
        startedAt: Date.now(),
    } as GameStartedResponse);

    gameRepository.deleteFromPublicGames(game.gameId);
}

export function sendGameOver(game: string | Game, gameResult: GameResult, reason: string): boolean {
    let gameId: string = "";
    let gameObj: Game | undefined;
    if (typeof game === "string") {
        gameId = game;
        gameObj = gameRepository.getById(gameId)
        if (!gameObj) return false;
    } else {
        gameId = game.gameId;
        gameObj = game;
    }

    if (!gameObj) {
        console.log(`Unable to send game over: game ${gameId} not found`);
        return false;
    }

    const payload: GameOverResponse = {
        result: gameResult,
        reason: reason
    }

    io.to(gameId).emit("game:over", payload);

    // Move game to db
    saveFinishedGame(gameObj).then(r => {
        // Delete after 5 minutes to allow for chat messages
        // setTimeout(() => {
        //     gameRepository.deleteById(gameId);
        // }, 1000 * 60 * 5)
    });

    return true;
}


export function handleRematch(game: Game) {
    let gameId = generateGameId(6);
    while (gameRepository.getById(gameId))
        gameId = Math.random().toString(36).substring(2, 8);
    const newGame = game.createRematchGame(gameId);
    gameRepository.save(newGame);
    // TODO: Swap the colors of the players

    const rematchAcceptedPayload: GameRematchAcceptedResponse = {
        newGameId: gameId,
    }
    io.to(game.gameId).emit("game:rematch:accepted", rematchAcceptedPayload);

}


export function sendClockStarted(game: Game) {
    if (!game.clockStartTimestamp) {
        console.warn(`Tried to send ClockStarted socket event without a defined clcokStartTimestamp on game ${game.gameId}`)
        return;
    }

    const payload: GameClockStartedResponse = {
        gameStatus: game.gameStatus,
        startedAt: game.clockStartTimestamp
    }
    io.to(game.gameId).emit("game:clock:started", payload);
}
