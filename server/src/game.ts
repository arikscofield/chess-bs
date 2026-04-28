import Board from "@common/src/board.js";
import {
    BluffPunishment,
    Color,
    type GameClockStateResponse,
    GameResult,
    type GameStateResponse,
    GameStatus, getMoveNotation,
    type Move,
    type Turn
} from "@common/src/index.js";
import Rule from "@common/src/rule.js";
import Player from "./player.js";
import {parseFen} from "./helper.js";
import type {
    CallBluff,
    GameDTO,
    GameMoveBluffCallFailedResponse,
    GameMoveBluffCallSucceededResponse
} from "@chess-bs/common";
import {sendClockStarted, sendGameOver} from "./socket/index.js";

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
    gameStartTimestamp: number;

    usesClock: boolean;
    clockStartTimestamp: number;
    clockStartMs?: number | undefined;
    clockIncrementMs?: number | undefined;
    clocksMs: Map<Color, number>;
    clockUpdateTimestamp: number;
    hasMoved: Map<Color, boolean>;

    drawOfferedColor: Color | null = null;
    rematchOfferedColor: Color | null = null;


    constructor(gameId: string, ruleCount: number, rulePool: Rule[], bluffPunishment: BluffPunishment, usesClock: boolean, clockStartMs?: number, clockIncrementMs?: number, fen?: string, ) {
        this.gameId = gameId;
        this.ruleCount = ruleCount;
        this.rulePool = rulePool;
        this.bluffPunishment = bluffPunishment;

        this.hasMoved = new Map();

        this.usesClock = usesClock;
        this.gameStartTimestamp = Date.now();
        this.clockStartTimestamp = 0;
        this.clockStartMs = clockStartMs;
        this.clockIncrementMs = clockIncrementMs;
        this.clocksMs = new Map<Color, number>();
        for (const c of Object.values(Color)) {
            this.clocksMs.set(c, clockStartMs ?? 0);
            this.hasMoved.set(c, false);
        }
        this.clockUpdateTimestamp = Date.now();

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

    public getClocks(now=Date.now()): Map<Color, number> {
        this.updateTimers(now);
        return this.clocksMs;
    }

    public getClockState(): GameClockStateResponse {
        this.updateTimers();

        return {
            usesClock: this.usesClock,
            startMs: this.clockStartMs,
            incrementMs: this.clockIncrementMs,
            startTimestamp: this.clockStartTimestamp,
        };
    }

    public updateTimers(now: number=Date.now()) {
        if (this.gameStatus !== GameStatus.RUNNING) return;

        const elapsed = now - this.clockUpdateTimestamp;
        const current = this.clocksMs.get(this.turnColor);
        if (current === undefined) return;
        this.clocksMs.set(this.turnColor, Math.max(0, current - elapsed));
        this.clockUpdateTimestamp = now;
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
            this.gameStartTimestamp = Date.now();
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

        const applyMove = (wasBluff: boolean) => {
            if (!this.currentBoard.applyMove(move)) {
                return false;
            }

            this.lastMoveWasBluff = wasBluff;
            this.prevBoard = prevBoard;

            // Add move to game history
            const moveCopy = structuredClone(move);
            delete moveCopy.bluff;
            moveCopy.timestamp = appliedAt;
            this.turnHistory.push(moveCopy);

            // Increment
            if (this.usesClock) {
                this.clocksMs.set(this.turnColor, (this.clocksMs.get(this.turnColor) || 0) + (this.clockIncrementMs ?? 0));
                this.hasMoved.set(this.turnColor, true);

                // Start the timer if each player has made a move
                if (this.gameStatus === GameStatus.WAITING_FOR_FIRST_MOVE && Array.from(this.hasMoved.values()).every(v => v)) {
                    this.startGameTimer();
                }
            }

            // Change turn
            this.turnColor = this.turnColor === Color.White ? Color.Black : Color.White;

            return true;
        }

        // Hasn't run out of time
        this.updateTimers(appliedAt);
        const currentTimeLeft = this.clocksMs.get(this.turnColor);
        if (currentTimeLeft && currentTimeLeft <= 0) {
            const gameResult: GameResult = this.turnColor === Color.White ? GameResult.Black : GameResult.White;
            this.endGame(gameResult, "Timeout");
            return false;
        }

        const prevBoard = this.currentBoard.clone();
        const legalMoves: Move[] = this.currentBoard.getLegalMoves(move.from, true);
        if (!move.notation) move.notation = getMoveNotation(this.currentBoard, move);
        if (!move.timestamp) move.timestamp = appliedAt;

        if (legalMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal regular chess move
            return applyMove(false);
        }

        let legalRuleMoves: Move[] = [];
        for (const rule of player.rules) {
            legalRuleMoves = legalRuleMoves.concat(rule.getLegalMoves(this.currentBoard, move.from));
        }
        if (legalRuleMoves.some((legalMove) => legalMove.to.row === move.to.row && legalMove.to.col === move.to.col)) {
            // Legal special rule move
            return applyMove(false);
        }

        // Bluffing
        if (move.bluff) {
            return applyMove(true);
        }

        // Non-legal move
        return false;
    }


    public callBluff(callerColor: Color, receivedAt: number): {ok: boolean, callSuccessful?: boolean, response?: GameMoveBluffCallSucceededResponse | GameMoveBluffCallFailedResponse, message?: string} {

        // Able to call bluff
        const prevTurn = this.turnHistory[this.turnHistory.length - 1];
        if (!(prevTurn && 'from' in prevTurn && prevTurn.piece?.color !== this.turnColor) || this.prevBoard === null) {
            return {ok: false, message: "Unable to call bluff"}
        }

        this.updateTimers(receivedAt);
        if (this.lastMoveWasBluff) {
            // Successful call
            const newTurn: CallBluff = {successful: true, callerColor: callerColor, timestamp: receivedAt}
            this.currentBoard = this.prevBoard;
            this.prevBoard = null;
            this.currentBoard.enPassant = null;
            this.turnHistory.push(newTurn)
            const responsePayload: GameMoveBluffCallSucceededResponse = {
                turn: newTurn,
                turnColor: this.turnColor,
                bluffPunishment: this.bluffPunishment,
                punished: this.turnColor === Color.White ? Color.Black : Color.White,
                appliedAt: receivedAt,
            }
            return {ok: true, callSuccessful: true, response: responsePayload, message: "Bluff call correct"}
        } else {
            // Failed call
            const newTurn: CallBluff = {successful: false, callerColor: callerColor, timestamp: receivedAt}
            this.turnColor = this.turnColor === Color.White ? Color.Black : Color.White;
            this.currentBoard.enPassant = null;
            this.turnHistory.push(newTurn)
            const responsePayload: GameMoveBluffCallFailedResponse = {
                turn: newTurn,
                turnColor: this.turnColor,
                bluffPunishment: this.bluffPunishment,
                punished: callerColor,
                appliedAt: receivedAt,
            }
            return {ok: true, callSuccessful: false, response: responsePayload, message: "Bluff call incorrect"}
        }
    }


    public startGameTimer(now = Date.now()) {
        this.gameStatus = GameStatus.RUNNING;
        this.clockUpdateTimestamp = now;
        this.clockStartTimestamp = now;
        sendClockStarted(this);
    }


    public endGame(gameResult: GameResult, reason: string): boolean {
        console.log(`Game ${this.gameId} ended: Result: ${gameResult}. Reason: ${reason}`);
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
                clockMs: this.clocksMs.get(player.color),
            })),
        };
    }

    public createRematchGame(newGameId: string): Game {
        const newGame = new Game(
            newGameId,
            this.ruleCount,
            this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined),
            this.bluffPunishment,
            this.usesClock,
            this.clockStartMs,
            this.clockIncrementMs
        );
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
        const newGame = new Game(
            this.gameId,
            this.ruleCount,
            this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined),
            this.bluffPunishment,
            this.usesClock,
            this.clockStartMs,
            this.clockIncrementMs
        );

        return newGame;
    }




    // public fromString(gameString: string): Game {
    //     const gameObj = JSON.parse(gameString);
    //     const newGame = new Game(gameObj.gameId, gameObj.creatorPlayerId, gameObj.creatorColor, gameObj.ruleCount, gameObj.rulePool)
    // }
}