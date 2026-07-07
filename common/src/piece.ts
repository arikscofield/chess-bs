import {Color, PieceType} from "./types.js";
import type {Piece as ZPiece} from "./schemas/common.js"


export default class Piece implements ZPiece {

    pieceType: PieceType;
    color: Color;
    hasMoved: boolean;

    constructor(pieceType: PieceType, color: Color) {
        this.pieceType = pieceType;
        this.color = color;
        this.hasMoved = false;
    }

}