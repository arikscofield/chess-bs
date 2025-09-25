import Board from "@chess-bs/common/dist/board.js";
import {Color, type GameState, GameStatus, type Move} from "@chess-bs/common";
// import Player from "@common/src/player.js";
import Player from "@chess-bs/common/dist/player.js";
import {parseFen} from "./helper.js";

const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default class Game {
    gameId: string;
    gameStatus: GameStatus;
    board: Board;
    creatorPlayerId: string;
    players: Player[];
    private moveHistory: Move[];
    turnColor: Color;
    lastMoveWasBluff: boolean;
    prevBoard: Board | null;

    constructor(gameId: string, createrPlayerId: string, fen: string = defaultFEN) {
        this.gameId = gameId;
        this.creatorPlayerId = createrPlayerId;
        this.gameStatus = GameStatus.WAITING_FOR_PLAYER;
        this.board = new Board();
        this.players = [];
        this.moveHistory = [];
        this.turnColor = Color.White;
        this.lastMoveWasBluff = false;
        this.prevBoard = new Board();

        this.setFromFEN(fen);
    }


    public getState(): GameState {
        return {
            gameStatus: this.gameStatus,
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
        
        if (this.players.length >= 2) {
            this.gameStatus = GameStatus.RUNNING;
        }

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
        const prevBoard = this.board.clone();
        const legalMoves: Move[] = this.board.getLegalMoves(move.from, true);

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            if (this.board.applyMove(move)) {
                this.lastMoveWasBluff = false;
                this.prevBoard = prevBoard;
                return true;
            }
            return false;
        }

        let legalRuleMoves: Move[] = [];
        for (const rule of player.rules) {
            legalRuleMoves = legalRuleMoves.concat(rule.getLegalMoves(this.board, move.from));
        }
        if (legalRuleMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal special rule move
            if (this.board.applyMove(move)) {
                this.lastMoveWasBluff = false;
                this.prevBoard = prevBoard;
                return true;
            }
            return false;
        }

        // Bluffing
        if (move.bluff) {
            if (this.board.applyMove(move)) {
                this.lastMoveWasBluff = true;
                this.prevBoard = prevBoard;
                return true;
            }
            return false;
        }

        // Non-legal move
        return false;
    }



    public setFromFEN(fen: string): void {
        const {grid, turn, enPassant, halfMove, fullMove} = parseFen(fen);

        this.board.grid = grid;
        this.turnColor = turn;
        this.board.enPassant = enPassant;
    }
}