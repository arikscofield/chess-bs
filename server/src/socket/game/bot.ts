import type {Socket} from "socket.io";
import type Game from "../../game.js";
import {
    BluffPunishment,
    type BotDecision, Color,
    type GameChatSystemResponse,
    type GameMoveAppliedResponse, GameResult
} from "@chess-bs/common";
import BotGame from "../../botGame.js";
import {io} from "../../server.js";
import type Player from "../../player.js";


export function isBotGame(game: Game) {
    return game instanceof BotGame;
}

export function handleBotMove(game: Game) {
    if (!(game instanceof BotGame)) {
        return;
    }
    const gameId = game.gameId;

    const botDecision: BotDecision = game.getBotMove();
    if (botDecision.type === "move") {
        if (!game.makeMove(botDecision.move, game.botPlayer)) {
            // callback(false, "Failed to generate bot move");
            console.warn("Failed to make bot move:", JSON.stringify(botDecision.move, null, 2));
            return;
        }
        const movePayload: GameMoveAppliedResponse = {
            move: botDecision.move,
            turnColor: game.turnColor,
            appliedAt: Date.now(),
        }
        io.to(gameId).emit("game:move:applied", movePayload);
    } else {
        const {ok, callSuccessful, response, message} = game.callBluff(game.botColor);
        if (!ok) {
            // callback(false, "Failed to generate bot move: " + message);
            return;
        }
        if (callSuccessful) {
            io.to(gameId).emit("game:move:bluff:call-succeeded", response);
            io.to(gameId).emit("game:chat:system", ({message: `${game.botColor} successfully called bluff`}) as GameChatSystemResponse);
            if (game.bluffPunishment === BluffPunishment.Turn) {
                const checkmatedColor = game.isInCheckmate();
                if (checkmatedColor) {
                    game.endGame(checkmatedColor === Color.White ? GameResult.Black : GameResult.White, "King captured");
                } else {
                    handleBotMove(game);
                    return;
                }
            }
        } else {
            io.to(gameId).emit("game:move:bluff:call-failed", response);
            io.to(gameId).emit("game:chat:system", ({message: `${game.botColor}'s bluff call was incorrect`}) as GameChatSystemResponse);
        }
    }

    // Check for "checkmate"
    const checkmatedColor = game.isInCheckmate();
    if (checkmatedColor) {
        game.endGame(checkmatedColor === Color.White ? GameResult.Black : GameResult.White, "King captured");
    }
}
