
export enum PieceType {
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King",
}

export const PiecePrefix: Record<string, PieceType> = {
    "p": PieceType.Pawn,
    "n": PieceType.Knight,
    "b": PieceType.Bishop,
    "r": PieceType.Rook,
    "q": PieceType.Queen,
    "k": PieceType.King,
}

export const RankMap: Record<string, number> = {
    "a": 0,
    "b": 1,
    "c": 2,
    "d": 3,
    "e": 4,
    "f": 5,
    "g": 6,
    "h": 7,
}

export enum Color {
    White = "White",
    Black = "Black",
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
}

export interface Rule {
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
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    DONE = "DONE",
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
    createGame: (color: CreateGameColor, timeControlStartSeconds: number | undefined, timeControlIncrementSeconds: number | undefined, bluffPunishment: BluffPunishment, ruleCount: number, rulePool: Rule[], callback: (
        {status, message, gameId}:
        {status: AckStatus, message: string, gameId?: string})
        => void) => void;
    joinGame: (gameId: string, callback: ({status, message}: {status: AckStatus, message: string}) => void) => void;
    move: (gameId: string, move: Move, callback: ({status, message}: {status: AckStatus, message: string}) => void) => void;
    callBluff: (gameId: string, callback: ({status, message}: {status: AckStatus, message: string, result?: boolean}) => void) => void;
    chatMessage: (gameId: string, message: string) => void;
}

export interface GameState {
    gameStatus: GameStatus;
    grid: (Piece | null)[][];
    enPassant: Square | null;
    turn: Color;
    moveHistory: Move[];
    rulePool?: Rule[];
    timers?: Record<Color, number> // Map<Color, number>
}

export interface PlayerState {
    playerId: string;
    color: Color;
    rules: Rule[];
}

export interface ServerToClientEvents {
    gameState: (gameState: GameState) => void;
    playerState: (playerState: PlayerState) => void;
    chatMessage: (message: string) => void;
    gameOver: (winner: Color, reason: string) => void;
}
