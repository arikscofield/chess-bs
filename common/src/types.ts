// import Board from "../server/board.js";
// import Board = require('../server/board.js');

export enum PieceType {
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King",
}

export enum Color {
    White = "White",
    Black = "Black",
}


export interface Piece {
    pieceType: PieceType;
    color: Color;
    hasMoved: boolean;
}

export interface Square {
    row: number,
    col: number,
}


export interface Move {
    from: Square,
    to: Square,
    piece: {
        type: PieceType,
        color: Color,
    },
}

export interface Rule {
    name: string;
    description: string;

    isMoveValid(move: Move, board: Board): boolean;
}

interface Board {
    grid: (Piece | null)[][];
}