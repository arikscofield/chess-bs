import Board from "@common/src/board.js";
import {
    BluffPunishment,
    Color,
    type GameClockStateResponse,
    GameResult,
    type GameStateResponse,
    GameStatus,
    type Move,
    type Turn
} from "@common/src/index.js";
import Rule from "@common/src/rule.js";
// import Player from "@common/src/player.js";
import Player from "./player.js";
import {parseFen} from "./helper.js";
import {clearInterval} from "node:timers";
import type {GameDTO} from "@chess-bs/common";
import {sendGameOver} from "./socket/index.js";

const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default class Game {
    gameId: string;
    gameStatus: GameStatus;
    startBoard: Board;
    currentBoard: Board;
    maxPlayers: number = 2;
    players: Player[];
    spectators: Set<string> = new Set<string>()

    turnHistory: Turn[];
    turnColor: Color;
    lastMoveWasBluff: boolean;
    prevBoard: Board | null;
    ruleCount: number;
    rulePool: Rule[];
    bluffPunishment: BluffPunishment;

    usesClock: boolean;
    gameStartTimestamp: Date;
    clockStartMs: number;
    clockIncrementMs: number;
    timeLeftMs: Map<Color, number>;
    timerUpdateTimestamp: number;
    private timerInterval: NodeJS.Timeout | null = null;
    hasMoved: Map<Color, boolean>;

    drawOfferedColor: Color | null = null;
    rematchOfferedColor: Color | null = null;


    constructor(gameId: string, ruleCount: number, rulePool: Rule[], bluffPunishment: BluffPunishment, timeControlStartMs: number | null = null, timeIncrementMs: number | null = null, fen?: string, ) {
        this.gameId = gameId;
        // this.creatorPlayerId = createrPlayerId;
        // this.creatorColor = creatorColor;
        this.ruleCount = ruleCount;
        this.rulePool = rulePool;
        this.bluffPunishment = bluffPunishment;

        this.hasMoved = new Map();
        if (timeControlStartMs !== null && timeIncrementMs !== null) {
            this.usesClock = true;
            this.gameStartTimestamp = new Date();
            this.clockStartMs = timeControlStartMs;
            this.clockIncrementMs = timeIncrementMs;
            this.timeLeftMs = new Map<Color, number>();
            for (const c of Object.values(Color)) {
                this.timeLeftMs.set(c, timeControlStartMs);
                this.hasMoved.set(c, false);
            }
            this.timerUpdateTimestamp = Date.now();
        } else {
            this.usesClock = false;
            this.gameStartTimestamp = new Date();
            this.clockStartMs = 0;
            this.clockIncrementMs = 0;
            this.timeLeftMs = new Map<Color, number>();
            this.timerUpdateTimestamp = 0;
        }

        this.gameStatus = GameStatus.WAITING_FOR_PLAYER;
        this.startBoard = Board.defaultBoard(); // TODO: be able to change based on how to user requests in order to have non-standard baord setups
        this.currentBoard = this.startBoard.clone();
        this.players = [];
        this.turnHistory = [];
        this.turnColor = Color.White;
        this.lastMoveWasBluff = false;
        this.prevBoard = new Board();

        this.setFromFEN(fen || defaultFEN);
    }



    public getState(): GameStateResponse {
        return {
            startBoard: this.startBoard,
            gameStatus: this.gameStatus,
            rulePoolIds: this.rulePool.map(r => r.id),
            clock: this.getClockState(),
            bluffPunishment: this.bluffPunishment,
            turnColor: this.turnColor,
            turnHistory: this.turnHistory,
            players: this.players.map(player => ({
                userId: player.userId,
                username: player.username,
                color: player.color,
            })),
            drawOfferedColor: this.drawOfferedColor,
        };
    }

    public getClockState(): GameClockStateResponse {
        this.updateTimers();

        return {
            usesClock: this.usesClock,
            startMs: this.clockStartMs,
            incrementMs: this.clockIncrementMs,
            gameStartTimestamp: this.gameStartTimestamp.getTime(),
        };
    }

    public updateTimers(now: number=Date.now()) {
        if (this.gameStatus !== GameStatus.RUNNING || this.timerInterval === null) return;

        const elapsed = now - this.timerUpdateTimestamp;
        const current = this.timeLeftMs.get(this.turnColor);
        if (current === undefined) return;
        this.timeLeftMs.set(this.turnColor, Math.max(0, current - elapsed));
        this.timerUpdateTimestamp = now;
    }


    public addPlayer(playerId: string, color?: Color, username?: string): Player | null {
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
                color = Object.values(Color)[Math.floor(Math.random() * Object.values(Color).length)] || Color.White
            }
        }

        const player =  new Player(playerId, color, undefined, username);
        player.setRandomRules(this.ruleCount, this.rulePool);
        this.players.push(player);
        
        if (this.players.length >= this.maxPlayers) {
            if (this.usesClock)
                this.gameStatus = GameStatus.WAITING_FOR_FIRST_MOVE;
            else
                this.gameStatus = GameStatus.RUNNING;
        }

        return player;
    }


    public getPlayer(playerId: string): Player | null {
        for (const player of this.players) {
            if (player.userId === playerId) {
                return player;
            }
        }
        return null;
    }

    public addSpectator(userId: string): void {
        this.spectators.add(userId);
    }

    public removeSpectator(userId: string): boolean {
        return this.spectators.delete(userId);
    }


    public makeMove(move: Move, player: Player, appliedAt: number=Date.now()): boolean {

        // Hasn't run out of time
        this.updateTimers(appliedAt);
        const currentTimeLeft = this.timeLeftMs.get(this.turnColor);
        if (currentTimeLeft && currentTimeLeft <= 0) {
            const gameResult: GameResult = this.turnColor === Color.White ? GameResult.Black : GameResult.White;
            const reason = "Timeout";
            this.endGame(gameResult, reason);
            return false;
        }

        const prevBoard = this.currentBoard.clone();
        const legalMoves: Move[] = this.currentBoard.getLegalMoves(move.from, true);

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            if (this.currentBoard.applyMove(move)) {
                this.lastMoveWasBluff = false;
                this.prevBoard = prevBoard;
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                moveCopy.timestamp = appliedAt;
                this.turnHistory.push(moveCopy);
                return true;
            }
            return false;
        }

        let legalRuleMoves: Move[] = [];
        for (const rule of player.rules) {
            legalRuleMoves = legalRuleMoves.concat(rule.getLegalMoves(this.currentBoard, move.from));
        }
        if (legalRuleMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal special rule move
            if (this.currentBoard.applyMove(move)) {
                this.lastMoveWasBluff = false;
                this.prevBoard = prevBoard;
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                moveCopy.timestamp = appliedAt;
                this.turnHistory.push(moveCopy);
                return true;
            }
            return false;
        }

        // Bluffing
        if (move.bluff) {
            if (this.currentBoard.applyMove(move)) {
                this.lastMoveWasBluff = true;
                this.prevBoard = prevBoard;
                const moveCopy = structuredClone(move);
                delete moveCopy.bluff;
                moveCopy.timestamp = appliedAt;
                this.turnHistory.push(moveCopy);
                return true;
            }
            return false;
        }

        // Non-legal move
        return false;
    }


    public startGameTimer() {
        if (this.timerInterval) return;

        const now = Date.now();
        this.gameStatus = GameStatus.RUNNING;
        this.timerUpdateTimestamp = now;
        this.gameStartTimestamp = new Date();

        this.timerInterval = setInterval(() => {
            this.updateTimers();
            const currentTimeLeft = this.timeLeftMs.get(this.turnColor);
            if (currentTimeLeft == undefined) return;

            if (currentTimeLeft <= 0) {
                this.endGame(this.turnColor === Color.White ? GameResult.Black : GameResult.White, "Timeout");
                return;
            }
        }, 1000);
    }


    public endGame(gameResult: GameResult, reason: string): boolean {
        console.log(`Game ${this.gameId} ended: Result: ${gameResult}. Reason: ${reason}`);

        // Stop Timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.gameStatus = GameStatus.DONE;
        return sendGameOver(this.gameId, gameResult, reason);
    }



    public setFromFEN(fen: string): void {
        const {grid, turn, enPassant, halfMove, fullMove} = parseFen(fen);

        this.currentBoard.grid = grid;
        this.turnColor = turn;
        this.currentBoard.enPassant = enPassant;
    }


    public getGameDTO(): GameDTO {

        return {
            bluffPunishment: this.bluffPunishment,
            gameStatus: this.gameStatus,
            rulePoolIds: this.rulePool.map((rule) => rule.id),
            turnHistory: this.turnHistory,
            startBoard: this.startBoard.getBoardDTO(),
            usesClock: this.usesClock,
            clockIncrementMs: this.clockIncrementMs,
            clockStartMs: this.clockStartMs,
            gameId: this.gameId,
            players: this.players.map(player => ({
                userId: player.userId,
                username: player.username,
                color: player.color,
                clockMs: this.timeLeftMs.get(player.color),
            })),
        };
    }

    public createRematchGame(newGameId: string): Game {
        const newGame = new Game(newGameId, this.ruleCount, this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined), this.bluffPunishment, this.clockStartMs, this.clockIncrementMs);
        newGame.gameStatus = GameStatus.WAITING_FOR_FIRST_MOVE;
        newGame.players = this.players.map(p => {
            p.color = p.color === Color.White ? Color.Black : Color.White
            return p;
        })
        newGame.maxPlayers = this.maxPlayers;

        return newGame;

    }

    public clone(): Game {
        // TODO: Properly set the startBoard to be the same
        const newGame = new Game(this.gameId, this.ruleCount, this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined), this.bluffPunishment, this.clockStartMs, this.clockIncrementMs);

        return newGame;
    }




    // public fromString(gameString: string): Game {
    //     const gameObj = JSON.parse(gameString);
    //     const newGame = new Game(gameObj.gameId, gameObj.creatorPlayerId, gameObj.creatorColor, gameObj.ruleCount, gameObj.rulePool)
    // }
}