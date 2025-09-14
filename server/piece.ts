import {Color, type Move, PieceType, type Square} from "@chess-bs/common";
import type Board from "./board.js";


export default class Piece {

    pieceType: PieceType;
    color: Color;
    row: number;
    col: number;
    hasMoved: boolean;

    constructor(pieceType: PieceType, color: Color, row=0, col=0) {
        this.pieceType = pieceType;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
    }

    /*
    Gets the legal moves of this piece, assuming it is at the square given.
    validateChecks prunes the legal moves of any that result in own king being in check
     */
    getLegalMoves(board: Board, square: Square, validateChecks=true): Move[] {

        const moves: Move[] = [];
        const {row, col} = square;
        const piece = {type: this.pieceType, color: this.color}; // TODO: Check if this causes an issue with references or something
        let moveOptions: [number, number][] = [];

        switch (this.pieceType) {
            case PieceType.Pawn:
                const direction = this.color === Color.White ? -1 : 1;

                // Single forward move
                if (board.getPiece({row: row+direction, col}) === null) {
                    moves.push({from: {row, col}, to: {row: row+direction, col}, piece});
                }

                // Double forward move
                if (!this.hasMoved && board.getPiece({row: row+(2*direction), col}) === null) {
                    moves.push({from: {row, col}, to: {row: row+(2*direction), col}, piece});
                }

                // Diagonal Capture
                if (board.getPiece({row: row+direction, col: col+1}) === null) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col+1}, piece});
                }
                if (board.getPiece({row: row+direction, col: col-1}) === null) {
                    moves.push({from: {row, col}, to: {row: row+direction, col: col-1}, piece});
                }


                // TODO: En Passant
                break;
            case PieceType.Knight:
                moveOptions = [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]];
                for (const [dr, dc] of moveOptions) {
                    const destPiece = board.getPiece({row: row+dr, col: col+dc});
                    if (destPiece !== undefined && (destPiece == null || destPiece.color !== this.color)) {
                        moves.push({from: {row, col}, to: {row: row+dr, col: col+dc}, piece});
                    }
                }
                break;
            case PieceType.Rook:
                moveOptions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                for (const [dr, dc] of moveOptions) {
                    let destRow = row+dr;
                    let destCol = col+dr;
                    let destPiece = board.getPiece({row: destRow, col: destCol});
                    while (destPiece !== undefined && destPiece?.color !== this.color) {
                        moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece});
                        if (destPiece !== null) break; // Ended on an enemy piece; stop here
                        destRow += dr;
                        destCol += dr;
                        destPiece = board.getPiece({row: destRow, col: destCol});
                    }
                }
                break;
            case PieceType.Bishop:
                for (const dr of [-1, 1]) {
                    for (const dc of [-1, 1]) {
                        let destRow = row+dr;
                        let destCol = col+dr;
                        let destPiece = board.getPiece({row: destRow, col: destCol});
                        while (destPiece !== undefined && destPiece?.color !== this.color) {
                            moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece});
                            if (destPiece !== null) break; // Ended on an enemy piece; stop here
                            destRow += dr;
                            destCol += dr;
                            destPiece = board.getPiece({row: destRow, col: destCol});
                        }
                    }
                }
                break;
            case PieceType.Queen:
                for (const dr of [-1, 0, 1]) {
                    for (const dc of [-1, 0, 1]) {
                        let destRow = row+dr;
                        let destCol = col+dr;
                        let destPiece = board.getPiece({row: destRow, col: destCol});
                        while (destPiece !== undefined && destPiece?.color !== this.color) {
                            moves.push({from: {row, col}, to: {row: destRow, col: destCol}, piece});
                            if (destPiece !== null) break; // Ended on an enemy piece; stop here
                            destRow += dr;
                            destCol += dr;
                            destPiece = board.getPiece({row: destRow, col: destCol});
                        }
                    }
                }
                break;

            case PieceType.King:
                moveOptions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [0, -1], [1, -1], [1, 0], [1, 1]];
                for (const [dr, dc] of moveOptions) {
                    const destPiece = board.getPiece({row: row+dr, col: col+dc});
                    if (destPiece !== undefined && (destPiece == null || destPiece.color !== this.color)) {
                        moves.push({from: {row, col}, to: {row: row+dr, col: col+dc}, piece});
                    }
                }

                // TODO: Castling

                break;
            default:
                break;
        }

        // TODO: Add validation that move doesn't put own king in check

        return moves;
    }

}