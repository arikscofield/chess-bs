
import gameHandler from "./game/game.js";
import {gameRepository, io} from "../server.js"
import chatHandler from "./game/chat.js";
import moveHandler from "./game/move.js";
import drawHandler from "./game/draw.js";
import rematchHandler from "./game/rematch.js";
import type {ZodObject} from "zod";
import Game from "../game.js";
import {saveFinishedGame} from "../db/helper.js";
import {type GameClockStartedResponse, type GameOverResponse, GameResult} from "@common/src/index.js";
import {generateGameId} from "../helper.js";
import {type GameRematchAcceptedResponse, GameStatus} from "@chess-bs/common";
import type {Server} from "socket.io";


export function validateSocketPayload(payload: Object, schema: ZodObject, source: string = ""): any {
    const result = schema.safeParse(payload);

    if (!result.success) {
        throw new Error(`${source ? `${source}: ` : ""}Invalid payload: ${result.error.message} `);
    }

    return result.data;
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

    const payload: GameClockStartedResponse = {
        gameStatus: game.gameStatus,
        startedAt: game.clockStartTimestamp
    }
    io.to(game.gameId).emit("game:clock:started", payload);
}


export function setUpSocketHandlers(io: Server) {

    const { joinGame, spectateGame, getState, resign } = gameHandler(io);
    const { sendChat,  } = chatHandler(io);
    const { sendMove, callBluff, punishmentChoosePiece } = moveHandler(io);
    const { offerDraw, cancelDraw, acceptDraw, declineDraw } = drawHandler(io);
    const { offerRematch, cancelRematch, acceptRematch, declineRematch } = rematchHandler(io);

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.data.user?.username} (${socket.data.user?.id})`)

        socket.on("game:join", joinGame);
        socket.on("game:spectate", spectateGame);
        socket.on("game:request-state", getState);
        socket.on("game:resign", resign);

        socket.on("game:chat:send", sendChat);

        socket.on("game:move:send", sendMove);
        socket.on("game:move:bluff:call", callBluff);
        socket.on("game:move:bluff:choose-piece", punishmentChoosePiece);

        socket.on("game:draw:offer", offerDraw);
        socket.on("game:draw:cancel-offer", cancelDraw);
        socket.on("game:draw:accept", acceptDraw);
        socket.on("game:draw:decline", declineDraw);

        socket.on("game:rematch:offer", offerRematch);
        socket.on("game:rematch:cancel-offer", cancelRematch);
        socket.on("game:rematch:accept", acceptRematch);
        socket.on("game:rematch:decline", declineRematch);

        socket.on("disconnecting", () => {
            console.log(`User disconnecting:  ${socket.data.user?.username} (${socket.data.user?.id})`)
            const rooms = socket.rooms;
            // for (const room of rooms.entries()) {
            //     console.log(room)
                // TODO: Remove spectators, trigger disconnect from live games
            // }
        })
    })
}

