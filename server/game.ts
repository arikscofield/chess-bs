import Board from "@chess-bs/common/dist/board.js";
import {
    BluffPunishment,
    Color,
    CreateGameColor, type GameInfo,
    type GameState,
    GameStatus,
    type Move,
    type Rule
} from "@chess-bs/common";
// import Player from "@common/src/player.js";
import Player from "@chess-bs/common/dist/player.js";
import {parseFen} from "./helper.js";
import {clearInterval} from "node:timers";
import {sendGameOver} from "./server.js";

const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default class Game {
    gameId: string;
    gameStatus: GameStatus;
    board: Board;
    creatorPlayerId: string;
    creatorColor: CreateGameColor;
    players: Player[];
    playersConnected: number;

    usesTimer: boolean;
    timeStartMs: number;
    timeIncrementMs: number;
    timeLeftMs: Map<Color, number>;
    timerUpdateTimestamp: number;
    private timerInterval: NodeJS.Timeout | null = null;
    hasMoved: Map<Color, boolean>;

    private moveHistory: Move[];
    turnColor: Color;
    lastMoveWasBluff: boolean;
    prevBoard: Board | null;
    ruleCount: number;
    rulePool: Rule[];
    bluffPunishment: BluffPunishment;

    constructor(gameId: string, createrPlayerId: string, creatorColor: CreateGameColor, ruleCount: number, rulePool: Rule[], bluffPunishment: BluffPunishment, timeControlStartMs?: number, timeIncrementMs?: number, fen?: string, ) {
        this.gameId = gameId;
        this.creatorPlayerId = createrPlayerId;
        this.creatorColor = creatorColor;
        this.ruleCount = ruleCount;
        this.rulePool = rulePool;
        this.bluffPunishment = bluffPunishment;

        this.hasMoved = new Map();
        if (timeControlStartMs !== undefined && timeIncrementMs !== undefined) {
            this.usesTimer = true;
            this.timeStartMs = timeControlStartMs;
            this.timeIncrementMs = timeIncrementMs;
            this.timeLeftMs = new Map<Color, number>();
            for (const c of Object.values(Color)) {
                this.timeLeftMs.set(c, timeControlStartMs);
                this.hasMoved.set(c, false);
            }
            this.timerUpdateTimestamp = Date.now();
        } else {
            this.usesTimer = false;
            this.timeStartMs = 0;
            this.timeIncrementMs = 0;
            this.timeLeftMs = new Map<Color, number>();
            this.timerUpdateTimestamp = 0;
        }

        this.gameStatus = GameStatus.WAITING_FOR_PLAYER;
        this.board = new Board();
        this.players = [];
        this.playersConnected = 0;
        this.moveHistory = [];
        this.turnColor = Color.White;
        this.lastMoveWasBluff = false;
        this.prevBoard = new Board();

        this.setFromFEN(fen || defaultFEN);
    }


    public getInfo(): GameInfo {
        return {
            rulePool: this.rulePool,
            usesTimer: this.usesTimer,
            timeStartMs: this.timeStartMs,
            timeIncrementMs: this.timeIncrementMs,
            bluffPunishment: this.bluffPunishment,
            creatorColor: this.creatorColor,
        }
    }

    public getState(): GameState {
        this.updateTimers();

        let state: GameState = {
            gameStatus: this.gameStatus,
            grid: this.board.grid,
            enPassant: this.board.enPassant,
            turn: this.turnColor,
            moveHistory: this.moveHistory,
            rulePool: this.rulePool,
        }

        if (this.usesTimer)
            state.timers = Object.fromEntries(this.timeLeftMs) as Record<Color, number>;

        return state;
    }

    public updateTimers() {
        if (this.gameStatus !== GameStatus.RUNNING || this.timerInterval === null) return;

        const now = Date.now();
        const elapsed = now - this.timerUpdateTimestamp;
        const current = this.timeLeftMs.get(this.turnColor);
        if (current === undefined) return;
        this.timeLeftMs.set(this.turnColor, Math.max(0, current - elapsed));
        this.timerUpdateTimestamp = now;
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

        const player =  new Player(playerId, color);
        player.setRandomRules(this.ruleCount, this.rulePool);
        this.players.push(player);
        
        if (this.players.length >= 2) {
            if (this.usesTimer)
                this.gameStatus = GameStatus.WAITING_FOR_FIRST_MOVE;
            else
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

        // Hasn't run out of time
        this.updateTimers();
        const currentTimeLeft = this.timeLeftMs.get(this.turnColor);
        if (currentTimeLeft && currentTimeLeft <= 0) {
            this.endGame(this.turnColor === Color.White ? Color.Black : Color.White, "Timeout");
            return false;
        }

        const prevBoard = this.board.clone();
        const legalMoves: Move[] = this.board.getLegalMoves(move.from, true);

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            if (this.board.applyMove(move)) {
                this.lastMoveWasBluff = false;
                this.prevBoard = prevBoard;
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                this.moveHistory.push(moveCopy);
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
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                this.moveHistory.push(moveCopy);
                return true;
            }
            return false;
        }

        // Bluffing
        if (move.bluff) {
            if (this.board.applyMove(move)) {
                this.lastMoveWasBluff = true;
                this.prevBoard = prevBoard;
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                this.moveHistory.push(moveCopy);
                return true;
            }
            return false;
        }

        // Non-legal move
        return false;
    }


    public startGameTimer() {
        if (this.timerInterval) return;

        this.gameStatus = GameStatus.RUNNING;
        this.timerUpdateTimestamp = Date.now();

        this.timerInterval = setInterval(() => {
            this.updateTimers();
            const currentTimeLeft = this.timeLeftMs.get(this.turnColor);
            if (currentTimeLeft == undefined) return;

            if (currentTimeLeft <= 0) {
                this.endGame(this.turnColor === Color.White ? Color.Black : Color.White, "Timeout");
                return;
            }
        }, 1000);
    }


    public endGame(winner: Color, reason: string): void {
        console.log(`Game ${this.gameId} ended: ${winner} wins. Reason: ${reason}`);

        // Stop Timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.gameStatus = GameStatus.DONE;
        sendGameOver(this.gameId, winner, reason);
    }



    public setFromFEN(fen: string): void {
        const {grid, turn, enPassant, halfMove, fullMove} = parseFen(fen);

        this.board.grid = grid;
        this.turnColor = turn;
        this.board.enPassant = enPassant;
    }
}