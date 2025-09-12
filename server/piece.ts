import {Color, PieceType} from "@common/types.js";


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

    getLegalMoves() {

    }

}