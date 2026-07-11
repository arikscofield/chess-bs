import {
    BluffPunishment,
    type CallBluff,
    Color,
    CreateGameColor,
    type GameClockStateResponse,
    type GameDTO,
    type GameMoveBluffCallFailedResponse,
    type GameMoveBluffCallSucceededResponse, type GamePlayerStateResponse,
    GameResult,
    type GameStateResponse,
    GameStatus,
    GameVisibility,
    getMoveNotation,
    type Move,
    nextTurnColor,
    parseFen,
    type Turn
} from "@chess-bs/common";
import Rule from "@chess-bs/common/dist/rule.js";
import Board from "@chess-bs/common/dist/board.js";
import Player from "./player.js";
import {colorToCreateGameColor, createGameColorToColor} from "./helper.js";
import {
    cleanupGame,
    sendClockStarted,
    sendGameOver,
    sendPlayerDisconnected,
    sendPlayerReconnected
} from "./socket/events.js";

const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const REPETITION_THRESHOLD = 3;
const LOBBY_ABANDON_MS = 1000 * 60;
const DISCONNECT_LOSS_MS = 1000 * 60 * 3;

export default class Game {
    gameId: string;
    gameStatus: GameStatus;
    startBoard: Board;
    currentBoard: Board;
    maxPlayers: number = 2;
    players: Player[];
    spectators: Set<string> = new Set<string>()
    creatorId: string;
    creatorColor: CreateGameColor;
    gameVisibility: GameVisibility;

    turnHistory: Turn[];
    positionCounts: Map<string, number> = new Map(); // Tracks how many times a position has occurred (for three-fold repetition)
    lastMoveWasBluff: boolean;
    prevBoard: Board | null;
    ruleCount: number;
    rulePool: Rule[];
    bluffPunishment: BluffPunishment;
    gameCreatedTimestamp: number;

    usesClock: boolean;
    clockStartTimestamp?: number | undefined;
    clockStartMs?: number | undefined;
    clockIncrementMs?: number | undefined;
    clocksMs: Map<Color, number>;
    clockUpdateTimestamp: number;
    private flagTimer: ReturnType<typeof setTimeout> | null = null;
    hasMoved: Map<Color, boolean>;

    private connectedSockets: Map<string, Set<string>> = new Map(); // Maps userIds to currently open sockets for this game
    private leaveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Maps userIds to currently running disconnect timers
    private playerLeftAfterGameOver: Set<string> = new Set<string>(); // Players that have left the game screen after the game has finished

    drawOfferedColor: Color | null = null;
    rematchOfferedColor: Color | null = null;


    constructor(
        gameId: string,
        ruleCount: number,
        rulePool: Rule[],
        bluffPunishment: BluffPunishment,
        creatorId: string,
        creatorColor: CreateGameColor,
        usesClock: boolean,
        clockStartMs?: number,
        clockIncrementMs?: number,
        fen?: string,
        gameVisibility?: GameVisibility,
        ) {
        this.gameId = gameId;
        this.ruleCount = ruleCount;
        this.rulePool = rulePool;
        this.bluffPunishment = bluffPunishment;
        this.creatorId = creatorId;
        this.creatorColor = creatorColor;
        this.gameVisibility = gameVisibility ?? GameVisibility.Private;

        this.hasMoved = new Map();

        this.usesClock = usesClock;
        this.gameCreatedTimestamp = Date.now();
        this.clockStartTimestamp = undefined;
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
        this.lastMoveWasBluff = false;
        this.prevBoard = new Board();

        this.setFromFEN(fen || defaultFEN);
    }

    get turnColor(): Color {
        return this.currentBoard.turnColor;
    }


    public getState(): GameStateResponse {
        const playersConnected: string[] = [];
        for (const [userId, socketIds] of this.connectedSockets.entries()) {
            if (socketIds.size > 0) playersConnected.push(userId);
        }
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
            playersConnected,
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

    public clearFlagTimer() {
        if (this.flagTimer) {
            clearTimeout(this.flagTimer);
            this.flagTimer = null;
        }
    }

    public scheduleFlagTimer(now: number = Date.now()) {
        this.clearFlagTimer();
        if (!this.usesClock || this.gameStatus !== GameStatus.RUNNING) return;

        this.updateTimers(now);
        const remaining = this.clocksMs.get(this.turnColor);
        if (remaining === undefined) return;

        const color = this.turnColor;
        this.flagTimer = setTimeout(() => this.flag(color), Math.max(0, remaining));
    }

    private flag(color: Color) {
        this.flagTimer = null;
        this.updateTimers();
        if (this.gameStatus !== GameStatus.RUNNING || this.turnColor !== color) return;

        const remaining = this.clocksMs.get(this.turnColor);
        if (remaining !== undefined && remaining > 0) {
            this.scheduleFlagTimer();
            return;
        }

        this.endGame(color === Color.White ? GameResult.Black : GameResult.White, "Timeout");
    }


    public addPlayer(playerId: string, color?: Color, username?: string): Player | null {
        if (this.players.length >= this.maxPlayers) {
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
                if (this.creatorColor === CreateGameColor.Random)
                    color = Object.values(Color)[Math.floor(Math.random() * Object.values(Color).length)] || Color.White
                else
                    color = this.creatorColor === CreateGameColor.White ? Color.White : Color.Black;
            }
        }

        const player =  new Player(playerId, color, Rule.getRandomRules(this.ruleCount, this.rulePool), username);
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

    public getPlayerState(playerId: string): GamePlayerStateResponse | null {
        const player = this.getPlayer(playerId);
        if (!player) return null;
        return player.getState();
    }

    public addSpectator(userId: string): void {
        this.spectators.add(userId);
    }

    public removeSpectator(userId: string): boolean {
        return this.spectators.delete(userId);
    }

    public playerConnect(userId: string, socketId: string): void {
        let sockets = this.connectedSockets.get(userId);
        if (!sockets) {
            sockets = new Set();
            this.connectedSockets.set(userId, sockets);
        }

        const wasDisconnected = sockets.size === 0;
        sockets.add(socketId);
        this.clearLeaveTimer(userId);

        if (wasDisconnected) sendPlayerReconnected(this.gameId, userId);
    }


    public playerDisconnect(userId: string, socketId: string): void {
        const sockets = this.connectedSockets.get(userId);
        if (!sockets) return;

        sockets.delete(socketId);
        if (sockets.size > 0) { // Player still has another socket/tab open for this game
            // console.log(`Not broadcasting disconnect since there's another open socket/tab: ${sockets}`)
            return;
        }

        switch (this.gameStatus) {
            case GameStatus.DONE:
                this.markPlayerLeftAfterGameOver(userId);
                return;
            case GameStatus.WAITING_FOR_PLAYER:
                this.leaveTimers.set(userId, setTimeout(() => cleanupGame(this.gameId), LOBBY_ABANDON_MS));
                return;
            case GameStatus.WAITING_FOR_FIRST_MOVE:
            case GameStatus.RUNNING:
                sendPlayerDisconnected(this.gameId, userId, this.usesClock ? DISCONNECT_LOSS_MS : undefined);
                if (!this.usesClock) return; // Can't lose by afk in Unlimited time games
                this.leaveTimers.set(userId, setTimeout(() => this.loseByDisconnect(userId), DISCONNECT_LOSS_MS));
                return;
        }
    }

    private markPlayerLeftAfterGameOver(userId: string) {
        this.playerLeftAfterGameOver.add(userId);
        if (this.players.length > 0 && this.players.every(p => this.playerLeftAfterGameOver.has(p.userId))) {
            cleanupGame(this.gameId);
        }
    }

    private clearLeaveTimer(userId: string) {
        const timer = this.leaveTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.leaveTimers.delete(userId);
        }
    }

    private loseByDisconnect(userId: string) {
        this.leaveTimers.delete(userId);
        if (this.gameStatus !== GameStatus.RUNNING && this.gameStatus !== GameStatus.WAITING_FOR_FIRST_MOVE) return;

        const player = this.getPlayer(userId);
        if (!player) return;

        const winner = player.color === Color.White ? GameResult.Black : GameResult.White;
        this.endGame(winner, `${player.color} disconnected`);
    }

    /**
     * Makes a given move for the given player. Does NOT validate whether the player is allowed to make a move.
     * Returns whether the move was successfully made or not.
     * @param move
     * @param player
     * @param appliedAt
     */
    public makeMove(move: Move, player: Player, appliedAt: number=Date.now()): boolean {

        // Hasn't run out of time
        if (this.usesClock) {
            this.updateTimers(appliedAt);
            const currentTimeLeft = this.clocksMs.get(this.turnColor);
            if (currentTimeLeft !== undefined && currentTimeLeft <= 0 && this.gameStatus === GameStatus.RUNNING) {
                const gameResult: GameResult = this.turnColor === Color.White ? GameResult.Black : GameResult.White;
                this.endGame(gameResult, "Timeout");
                return false;
            }
        }

        const prevBoard = this.currentBoard.clone();
        const legalMoves: Move[] = this.currentBoard.getLegalMoves(move.from, true);
        if (!move.notation) move.notation = getMoveNotation(this.currentBoard, move);
        if (!move.timestamp) move.timestamp = appliedAt;


        const applyMove = (wasBluff: boolean) => {
            const color = this.turnColor;
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
                this.clocksMs.set(color, (this.clocksMs.get(color) || 0) + (this.clockIncrementMs ?? 0));
                this.hasMoved.set(color, true);

                // Start the timer if each player has made a move
                if (this.gameStatus === GameStatus.WAITING_FOR_FIRST_MOVE && Array.from(this.hasMoved.values()).every(v => v)) {
                    this.startGameTimer();
                }
            }

            if (this.currentBoard.halfMoveClock >= 50) {
                this.endGame(GameResult.Draw, "Fifty move rule")
            }

            this.recordPosition(); // Detects for repetition

            this.scheduleFlagTimer(appliedAt);

            return true;
        }

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


    public callBluff(callerColor: Color, receivedAt: number = Date.now()): {ok: boolean, callSuccessful?: boolean, response?: GameMoveBluffCallSucceededResponse | GameMoveBluffCallFailedResponse, message?: string} {

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
            if (this.bluffPunishment === BluffPunishment.Turn)
                this.currentBoard.turnColor = nextTurnColor(this.currentBoard.turnColor);
            const responsePayload: GameMoveBluffCallSucceededResponse = {
                turn: newTurn,
                turnColor: this.turnColor,
                bluffPunishment: this.bluffPunishment,
                punished: this.turnColor === Color.White ? Color.Black : Color.White,
                appliedAt: receivedAt,
            }
            this.scheduleFlagTimer(receivedAt);
            return {ok: true, callSuccessful: true, response: responsePayload, message: "Bluff call correct"}
        } else {
            // Failed call
            const newTurn: CallBluff = {successful: false, callerColor: callerColor, timestamp: receivedAt}
            this.currentBoard.enPassant = null;
            this.turnHistory.push(newTurn)
            if (this.bluffPunishment === BluffPunishment.Turn)
                this.currentBoard.turnColor = nextTurnColor(this.currentBoard.turnColor);
            const responsePayload: GameMoveBluffCallFailedResponse = {
                turn: newTurn,
                turnColor: this.turnColor,
                bluffPunishment: this.bluffPunishment,
                punished: callerColor,
                appliedAt: receivedAt,
            }
            this.scheduleFlagTimer(receivedAt);
            return {ok: true, callSuccessful: false, response: responsePayload, message: "Bluff call incorrect"}
        }
    }

    public isInCheckmate(): Color | null {
        for (const player of this.players) {
            const playerColor = player.color;
            const oppColor = player.color === Color.White ? Color.Black : Color.White;
            if (this.currentBoard.findKing(playerColor) === null) {
                console.log(`${this.gameId}: ${playerColor} king missing.\n\t${this.turnColor == oppColor}\n\t${this.turnColor == playerColor && !this.lastMoveWasBluff}`)
                if (this.turnColor === oppColor || (this.turnColor === playerColor && !this.lastMoveWasBluff)) {
                    return playerColor;
                }
            }
        }
        return null;
    }


    /**
     * Stores the current board position and checks for draw by repetition
     */
    public recordPosition(): void {
        const key = this.currentBoard.getPositionKey();
        const count = (this.positionCounts.get(key) ?? 0) + 1;
        this.positionCounts.set(key, count);

        if (count >= REPETITION_THRESHOLD) {
            this.endGame(GameResult.Draw, "Repetition");
        }
    }

    public startGameTimer(now = Date.now()) {
        this.gameStatus = GameStatus.RUNNING;
        this.clockUpdateTimestamp = now;
        this.clockStartTimestamp = now;
        this.scheduleFlagTimer(now);
        sendClockStarted(this);
    }


    public endGame(gameResult: GameResult, reason: string): boolean {
        console.log(`Game ${this.gameId} ended: Result: ${gameResult}. Reason: ${reason}`);
        this.gameStatus = GameStatus.DONE;
        this.clearFlagTimer();
        return sendGameOver(this.gameId, gameResult, reason);
    }



    public setFromFEN(fen: string): void {
        const {grid, turn, enPassant, halfMoveClock, fullMove} = parseFen(fen);

        this.currentBoard = new Board(grid, enPassant, turn, halfMoveClock, fullMove);
    }


    public getGameDTO(): GameDTO {

        return {
            gameId: this.gameId,
            bluffPunishment: this.bluffPunishment,
            gameStatus: this.gameStatus,
            ruleCount: this.ruleCount,
            rulePoolIds: this.rulePool.map((rule) => rule.id),
            turnHistory: this.turnHistory,
            startBoard: this.startBoard.getBoardDTO(),
            gameCreatedTimestamp: this.gameCreatedTimestamp,

            usesClock: this.usesClock,
            clockIncrementMs: this.clockIncrementMs,
            clockStartMs: this.clockStartMs,
            clockStartTimestamp: this.clockStartTimestamp,

            players: this.players.map(player => ({
                userId: player.userId,
                username: player.username,
                color: player.color,
                clockMs: this.clocksMs.get(player.color),
            })),
        };
    }

    public createRematchGame(newGameId: string): Game {
        const prevCreatorColor: Color = this.creatorColor === CreateGameColor.Random ? this.players.find(p => p.userId === this.creatorId)?.color ?? Color.White : createGameColorToColor(this.creatorColor);
        const newGame = new Game(
            newGameId,
            this.ruleCount,
            this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined),
            this.bluffPunishment,
            this.creatorId,
            colorToCreateGameColor(nextTurnColor(prevCreatorColor)),
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
        return new Game(
            this.gameId,
            this.ruleCount,
            this.rulePool.map(r => Rule.getRuleFromId(r.id)).filter(r => r !== undefined),
            this.bluffPunishment,
            this.creatorId,
            this.creatorColor,
            this.usesClock,
            this.clockStartMs,
            this.clockIncrementMs
        );
    }




    // public fromString(gameString: string): Game {
    //     const gameObj = JSON.parse(gameString);
    //     const newGame = new Game(gameObj.gameId, gameObj.creatorPlayerId, gameObj.creatorColor, gameObj.ruleCount, gameObj.rulePool)
    // }
}