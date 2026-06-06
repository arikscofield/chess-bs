


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

export function parseFen(fen: string): {grid: (Piece | null)[][], turn: Color, enPassant: Square | null, halfMove: number, fullMove: number} {
    const grid: (Piece | null)[][] = [];
    let turn = Color.White;
    let enPassant: Square | null = null;
    let halfMove = 0;
    let fullMove = 0;

    if (fen.length === 0) return {grid, turn, enPassant, halfMove, fullMove};

    const [allPieces, fenTurn, castle, fenEnPassant, fenHalfMove, fenFullMove] = fen.split(" ");
    if (!allPieces) return {grid, turn, enPassant, halfMove, fullMove};
    const pieces: string[] = allPieces.split("/");

    for (const row of pieces) {
        grid.push([]);
        for (const pieceLetter of row) {
            const pieceType = PrefixToPieceType[pieceLetter.toLowerCase()];
            if (pieceType) {
                const pieceColor: Color = pieceLetter.toUpperCase() === pieceLetter ? Color.White : Color.Black;
                const piece = new PieceClass(pieceType, pieceColor);

                // Setting castle availability
                if (pieceType === PieceType.Rook && castle) {
                    if (grid.at(-1)?.length === 0) { // Queenside rook
                        if (pieceColor === Color.White) {
                            piece.hasMoved = !castle.includes("Q");
                        } else if (pieceColor === Color.Black) {
                            piece.hasMoved = !castle.includes("q");
                        }
                    } else { // Kingside rook
                        if (pieceColor === Color.White) {
                            piece.hasMoved = !castle.includes("K");
                        } else if (pieceColor === Color.Black) {
                            piece.hasMoved = !castle.includes("k");
                        }
                    }
                }

                grid.at(-1)?.push(piece);
            } else {
                const blankCount = parseInt(pieceLetter);
                for (let _=0; _< blankCount; _++) {
                    grid.at(-1)?.push(null);
                }
            }
        }
    }


    if (fenTurn) turn = fenTurn === "w" ? Color.White : Color.Black;
    if (fenEnPassant && fenEnPassant !== "-") {
        enPassant = {row: parseInt(fenEnPassant[1] || "0"), col: FileToIndex[fenEnPassant[0] || "a"] || 0};
    }
    if (fenHalfMove) halfMove = parseInt(fenHalfMove);
    if (fenFullMove) fullMove = parseInt(fenFullMove);


    return {grid, turn, enPassant, halfMove, fullMove};
}





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

    console.log(players);

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





