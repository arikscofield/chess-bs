


// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

import {
    Color,
    type Piece,
    PrefixToPieceType,
    PieceType,
    FileToIndex,
    type Square,
    type Move,
    PieceAscii, IndexToFile, PieceTypeToPrefix
} from "@chess-bs/common";
import PieceClass from "@chess-bs/common/dist/piece.js"
import Board from "@common/src/board.js";

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


export function getMoveNotation(board: Board, move: Move): string {
    let notation = "";

    // Piece letter/symbol
    if (move.piece.type != PieceType.Pawn) notation += PieceAscii[move.piece.color][move.piece.type];

    // Piece source square disambiguation

    // Squares with pieces that are of the same type
    const samePieceSquares = board.findPieces(move.piece.type, move.piece.color);
    // console.log("samePieceSquares:", samePieceSquares);

    // Squares with pieces that can move to the same destination square
    const sameMoveSquares = samePieceSquares.filter((square) =>
        (square.row !== move.from.row && square.col !== move.from.col) && board.getLegalMoves(square, false, false).some((move2) =>
            move.to.row === move2.to.row && move.to.col == move2.to.col
        )
    )
    // console.log("sameMoveSquares:", sameMoveSquares);

    if (sameMoveSquares.length > 0) {
        // If none of the ambiguating pieces are on the same file, we can just use the file to disambiguate
        if (!sameMoveSquares.some((square) => square.col === move.from.col)) {
            notation += IndexToFile[move.from.col]
        } else if (!sameMoveSquares.filter((square) => square.col === move.from.col).some((square) => square.row === move.from.row)) {
            // If the files are the same but the ranks differ, just use the rank
            notation += "" + (7-move.from.row+1)
        } else {
            // Otherwise, use both the file and rank
            notation += "" + IndexToFile[move.from.col] + (7-move.from.row+1)
        }
    }


    // Captures
    // Either the piece directly captures, or en passant
    const isCapture = board.getPiece(move.to) || (move.piece.type == PieceType.Pawn && move.from.col != move.to.col);
    if (isCapture) {
        // Always specify the file if it's a pawn capturing
        if (move.piece.type === PieceType.Pawn) {
            notation = "" + IndexToFile[move.from.col] + "x"
        } else {
            notation += "x"
        }
    }

    // Destination square
    notation += "" + IndexToFile[move.to.col] + (7-move.to.row+1)


    // Pawn Promotion
    if (move.promotion) {
        notation += "=" + PieceAscii[move.piece.color][move.promotion];
    }


    // Castling
    // FIXME: Can incorrectly label a bluffing king move as castling
    if (move.piece.type === PieceType.King && move.from.row == move.to.row) {
        // Kingside
        if (Math.abs(move.from.col - move.to.col) == 2) {
            notation = "O-O"
        }
        // Queenside
        else if (Math.abs(move.from.col - move.to.col) == 3) {
            notation = "O-O-O"
        }
    }

    // Checks
    const movedBoard = board.clone();
    movedBoard.applyMove(move);
    if (movedBoard.isInCheck(move.piece.color === Color.White ? Color.Black : Color.White)) {
        notation += "+"
    }


    return notation;
}