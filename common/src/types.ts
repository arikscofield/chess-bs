
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
}

export interface Rule {
    name: string;
    description: string;

    isMoveValid(move: Move, board: Board): boolean;
}

export interface Board {
    grid: (Piece | null)[][];
    enPassant: Square | null;

    getLegalMoves(square: Square, validateChecks: boolean): Move[];
}

interface Player {
    color: Color;
    rules: Rule[];
}




// -------- Socket Events -------------

export enum AckStatus {
    OK = "OK",
    ERROR = "ERROR",
}

export interface ClientToServerEvents {
    createGame: (playerId: string, color: Color, callback: ({status, message, gameId}: {status: AckStatus, message: string, gameId?: string, color?: Color}) => void) => void;
    joinGame: (gameId: string, playerId: string, callback: ({status, message}: {status: AckStatus, message: string, color?: Color}) => void) => void;
    move: (gameId: string, playerId: string, move: Move, callback: ({status, message}: {status: AckStatus, message: string}) => void) => void;
}

export interface GameState {
    grid: (Piece | null)[][];
    enPassant: Square | null;
    turn: Color;
}

export interface PlayerState {
    playerId: string;
    rules: Rule[];
}

export interface ServerToClientEvents {
    gameState: (gameState: GameState) => void;
    playerState: (playerState: PlayerState) => void;
}
