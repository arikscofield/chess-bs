import Board from "./board.js";
import {Color, type Move} from "@chess-bs/common";
import {Player} from "./player.js";


class Game {
    private board: Board;
    private players: { [key in Color]: Player };
    private moveHistory: Move[];
    private turnColor: Color;

    constructor() {
        this.board = new Board();
        this.players = { [Color.White]: new Player(), [Color.Black]: new Player()}; // TODO: Change to actual initialization
        this.moveHistory = [];
        this.turnColor = Color.White;

    }
}