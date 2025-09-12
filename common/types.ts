import Board from "../server/board";

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
    row: number;
    col: number;
    hasMoved: boolean;
}

export interface Square {
    rank: number,
    file: number,
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