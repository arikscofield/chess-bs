


// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

import {
    Color,
    CreateGameColor,
    FileToIndex,
    type GameDTO,
    GameStatus,
    type Piece,
    PieceType,
    type PlayerDTO,
    PrefixToPieceType,
    type Square,
    type UserDTO
} from "@chess-bs/common";
import PieceClass from "@chess-bs/common/src/piece.js"
import {v4 as uuidv4} from "uuid";
import type {Game as FinishedGame, User} from "./db/schema.js";
import {getFinishedGameById, getPlayersFromGameWithUser} from "./db/helper.js";
import {gameRepository} from "./server.js";

export function generateGameId(len: number) {
    const chars: string = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    let result: string = "";
    for (let i=0; i < len; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

export function generateUUID() {
    return crypto.randomUUID?.() ?? uuidv4();
}

export async function gameIdExists(gameId: string): Promise<boolean> {
    if (gameRepository.getById(gameId)) return true;
    const finishedGame = await getFinishedGameById(gameId);
    return finishedGame !== null;
}

export async function getGameDTOFromFinishedGame(finishedGame: FinishedGame): Promise<GameDTO> {
    const players: PlayerDTO[] = (await getPlayersFromGameWithUser(finishedGame.id)).map(player => ({
        userId: player.user.id,
        username: player.user.username,
        color: player.color,
        ruleIds: player.ruleIds,
    }));

    return {
        gameId: finishedGame.id,
        gameStatus: GameStatus.DONE,
        startBoard: finishedGame.startBoard,
        rulePoolIds: finishedGame.rulePoolIds,
        turnHistory: finishedGame.turnHistory,
        bluffPunishment: finishedGame.bluffPunishment,
        gameCreatedTimestamp: finishedGame.createdAt.getTime(),

        usesClock: finishedGame.usesClock,
        clockStartTimestamp: finishedGame.clockStartedAt?.getTime(),
        clockStartMs: finishedGame.clockStartMs,
        clockIncrementMs: finishedGame.clockIncrementMs,

        players: players,
    }
}


export function createGameColorToColor(createGameColor: CreateGameColor): Color {
    switch (createGameColor) {
        case CreateGameColor.White:
            return Color.White;
        case CreateGameColor.Black:
            return Color.Black;
        case CreateGameColor.Random:
        default:
            const colors = Object.values(Color);
            return colors[Math.floor(Math.random() * colors.length)] ?? Color.White;
    }
}

export function colorToCreateGameColor(color: Color): CreateGameColor {
    switch (color) {
        case Color.White:
            return CreateGameColor.White;
        case Color.Black:
            return CreateGameColor.Black;
    }
}


export function getUserDTOFromUser(user: User): UserDTO {
    return {
        userId: user.id,
        username: user.username,
    }
}





