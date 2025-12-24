


// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1


import PieceClass from "./piece";
import {
    Color, FileToIndex, IndexToFile, Move, type Piece, PieceAscii, PrefixToPieceType, PieceType, Square,
    PieceTypeToPrefix
} from "./types";
import Board from "./board";

export const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

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

