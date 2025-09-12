import Board from "./board";
import {Color, Move} from "../common/types";
import {Player} from "./player";


class Game {
    private board: Board;
    private players: { [key in Color]: Player };
    private moveHistory: Move[];
    private turnColor: Color;

    constructor() {
        this.board = new Board();

    }
}