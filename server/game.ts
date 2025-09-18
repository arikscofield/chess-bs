import Board from "@chess-bs/common/dist/board.js";
import {Color, type Move, type GameState} from "@chess-bs/common";
// import Player from "@common/src/player.js";
import Player from "@chess-bs/common/dist/player.js";
import {parseFen} from "./helper.js";

const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default class Game {
    private gameId: string;
    board: Board;
    players: Player[];
    private moveHistory: Move[];
    turnColor: Color;

    constructor(gameId: string, fen: string = defaultFEN) {
        this.gameId = gameId;
        this.board = new Board();
        this.players = [];
        this.moveHistory = [];
        this.turnColor = Color.White;

        this.setFromFEN(fen);
    }


    public getState(): GameState {
        return {
            grid: this.board.grid,
            enPassant: this.board.enPassant,
            turn: this.turnColor
        }
    }


    public addPlayer(playerId: string, color?: Color): Player | null {
        if (this.players.length >= 2) {
            return null;
        }

        if (color) {
            if (this.players.length >= 1 && this.players[0]?.color === color) {
                return null;
            }
        } else {
            if (this.players.length >= 1) {
                color = this.players[0]?.color === Color.White ? Color.Black : Color.White;
            } else {
                color = Color.White
            }
        }

        const player =  new Player(playerId, color, 2);
        this.players.push(player);

        return player;
    }


    public getPlayer(playerId: string): Player | null {
        for (const player of this.players) {
            if (player.playerId === playerId) {
                return player;
            }
        }
        return null;
    }


    public makeMove(move: Move, player: Player): boolean {
        const legalMoves: Move[] = this.board.getLegalMoves(move.from, true);

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            return this.board.applyMove(move);
        }

        let legalRuleMoves: Move[] = [];
        for (const rule of player.rules) {
            legalRuleMoves = legalRuleMoves.concat(rule.getLegalMoves(this.board, move.from));
        }
        if (legalRuleMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal special rule move
            return this.board.applyMove(move);
        }

        // Non-legal move TODO: do the move, but mark move as a bluff
        return false;
    }



    public setFromFEN(fen: string): void {
        const {grid, turn, enPassant, halfMove, fullMove} = parseFen(fen);

        this.board.grid = grid;
        this.turnColor = turn;
        this.board.enPassant = enPassant;
    }
}