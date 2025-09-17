import {Color, type Move, PieceType, type Square} from "./types";
import type Board from "./board";


export default class Piece {

    pieceType: PieceType;
    color: Color;
    hasMoved: boolean;

    constructor(pieceType: PieceType, color: Color) {
        this.pieceType = pieceType;
        this.color = color;
        this.hasMoved = false;
    }

}