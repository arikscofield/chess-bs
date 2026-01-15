
export enum PieceType {
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King",
}

export enum Color {
    White = "White",
    Black = "Black",
}

export const PrefixToPieceType: Record<string, PieceType> = {
    "p": PieceType.Pawn,
    "n": PieceType.Knight,
    "b": PieceType.Bishop,
    "r": PieceType.Rook,
    "q": PieceType.Queen,
    "k": PieceType.King,
}

export const PieceTypeToPrefix: Record<PieceType, string> = {
    [PieceType.Pawn]: "p",
    [PieceType.Knight]: "n",
    [PieceType.Bishop]: "b",
    [PieceType.Rook]: "r",
    [PieceType.Queen]: "q",
    [PieceType.King]: "k",
}

export const FileToIndex: Record<string, number> = {
    "a": 0,
    "b": 1,
    "c": 2,
    "d": 3,
    "e": 4,
    "f": 5,
    "g": 6,
    "h": 7,
}

export const IndexToFile: Record<number, string> = {
    0: "a",
    1: "b",
    2: "c",
    3: "d",
    4: "e",
    5: "f",
    6: "g",
    7: "h",
}

export const PieceAscii: Record<Color, Record<PieceType, string>> = {
    [Color.White]: {
        [PieceType.Pawn]: "♙",
        [PieceType.Knight]: "♘",
        [PieceType.Bishop]: "♗",
        [PieceType.Rook]: "♖",
        [PieceType.Queen]: "♕",
        [PieceType.King]: "♔"
    },
    [Color.Black]: {
        [PieceType.Pawn]: "♟",
        [PieceType.Knight]: "♞",
        [PieceType.Bishop]: "♝",
        [PieceType.Rook]: "♜",
        [PieceType.Queen]: "♛",
        [PieceType.King]: "♚"
    }
}

export const BoardColorType: Record<string, [string, string, string, string]> = {
    Brown: ["bg-board-brown-light", "bg-board-brown-dark", "text-board-brown-light", "text-board-brown-dark"],
    Green: ["bg-board-green-light", "bg-board-green-dark", "text-board-green-light", "text-board-green-dark"],
}


export interface Piece {
    pieceType: PieceType;
    color: Color;
    hasMoved: boolean;
}

export interface Square {
    row: number,
    col: number,
}


export interface Move {
    from: Square,
    to: Square,
    piece: {
        type: PieceType,
        color: Color,
    },
    promotion?: PieceType,
    bluff?: boolean,
    timestamp?: number,
    notation?: string,
}

export interface CallBluff {
    callerColor: Color,
    successful: boolean,
    timestamp?: number,
}

export type Turn = Move | CallBluff

export interface Rule {
    id: number,
    name: string;
    description: string;
    pieceType: PieceType;

    getLegalMoves(board: Board, square: Square): Move[];
}

export interface Board {
    grid: (Piece | null)[][];
    enPassant: Square | null;

    attackers(square: Square, color: Color): Square[];
    getPiece(square: Square): Piece | null | undefined;
    setPiece(square: Square, piece: Piece | null): boolean;
    applyMove(move: Move): boolean;
    getLegalMoves(square: Square, validateChecks: boolean): Move[];
    findKing(color: Color): Square | null;
    clone(): Board;
}

export interface Player {
    playerId: string;
    color: Color;
    rules: Rule[];
}


export enum GameStatus {
    WAITING_FOR_PLAYER = "WAITING_FOR_PLAYER",
    WAITING_FOR_FIRST_MOVE = "WAITING_FOR_FIRST_MOVE",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    DONE = "DONE",
}


export enum GameResult {
    White = Color.White,
    Black = Color.Black,
    Tie = "Tie"
}


export enum CreateGameColor {
    White = Color.White,
    Black = Color.Black,
    Random = "Random",
}

export enum BluffPunishment {
    Turn = "turn",
    Piece = "piece",
    PieceOpponent = "pieceOpponent",
    PieceRandom = "pieceRandom",
}


// -------- Socket Events -------------

export enum AckStatus {
    OK = "OK",
    ERROR = "ERROR",
}

export interface ClientToServerEvents {
    createGame: (color: CreateGameColor, timeControlStartSeconds: number | null, timeControlIncrementSeconds: number | null, bluffPunishment: BluffPunishment, ruleCount: number, rulePool: Rule[], callback: (
        {status, message, gameId}:
        {status: AckStatus, message: string, gameId?: string})
        => void) => void;
    joinGame: (gameId: string, callback: ({status, message}: {status: AckStatus, message: string}) => void) => void;
    move: (gameId: string, move: Move, callback: ({status, message}: {status: AckStatus, message: string}) => void) => void;
    callBluff: (gameId: string, callback: ({status, message}: {status: AckStatus, message: string, result?: boolean}) => void) => void;
    chatMessage: (gameId: string, message: string) => void;
}


export interface GameInfo {
    startGrid: (Piece | null)[][];
    rulePool: Rule[];
    usesTimer: boolean;
    timeStartMs: number;
    timeIncrementMs: number;
    bluffPunishment: BluffPunishment;
    creatorColor: CreateGameColor;
}

export interface GameState {
    gameStatus: GameStatus;
    grid: (Piece | null)[][];
    enPassant: Square | null;
    turn: Color;
    turnHistory: Turn[];
    rulePool?: Rule[];
    timers?: Record<Color, number> // Map<Color, number>
}

export interface PlayerState {
    playerId: string;
    color: Color;
    ruleIds: number[];
}


export interface ReplayTimerInfo {
    gameStartTimestamp: Date;
    startMs: number;
    incrementMs: number;
}

export interface ReplayInfo {
    startGrid: (Piece | null)[][];
    rulePoolIds: number[];
    playerRuleIds: Record<Color, number[]>;
    timerInfo?: ReplayTimerInfo;
    turnHistory: Turn[];
    bluffPunishment: BluffPunishment;
}

export interface ServerToClientEvents {
    gameInfo: (gameInfo: GameInfo) => void;
    gameState: (gameState: GameState) => void;
    playerState: (playerState: PlayerState) => void;
    replayInfo: (replayInfo: ReplayInfo) => void;
    chatMessage: (message: string) => void;
    gameOver: (gameResult: GameResult, reason: string) => void;
}
