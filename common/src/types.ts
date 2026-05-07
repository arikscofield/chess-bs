import type {
    GameAbortedResponse,
    GameChatMessageResponse,
    GameChatSendRequest,
    GameClockStartedResponse, GameClockStateResponse, GameDrawAcceptRequest, GameDrawCancelledResponse,
    GameDrawCancelOfferRequest,
    GameDrawDeclinedResponse, GameDrawDeclineRequest, GameDrawOfferedResponse, GameDrawOfferRequest,
    GameJoinRequest,
    GameMoveAppliedResponse, GameMoveBluffCallFailedResponse, GameMoveBluffCallRequest,
    GameMoveBluffCallSucceededResponse, GameMoveBluffChoosePieceRequest, GameMoveBluffLostPieceResponse,
    GameMoveSendRequest, GameOverResponse,
    GamePlayerJoinedResponse,
    GamePlayerStateResponse, GameRematchAcceptedResponse, GameRematchAcceptRequest,
    GameRematchCancelledResponse, GameRematchCancelOfferRequest, GameRematchDeclinedResponse, GameRematchDeclineRequest,
    GameRematchOfferedResponse, GameRematchOfferRequest,
    GameRequestStateRequest, GameResignRequest,
    GameSpectateRequest, GameStartedResponse, GameStateResponse
} from "./schemas/socket";
import type {Move,} from "./schemas/common";

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

export enum UserType {
    Guest = "guest",
    User = "user",
    Admin = "admin",
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
    Draw = "Draw"
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


export type GenericCallback = (ok: boolean, message?: string, data?: any) => void;

export interface ClientToServerEvents {
    "game:join": (payload: GameJoinRequest, callback: GenericCallback) => void;
    "game:spectate": (payload: GameSpectateRequest, callback: GenericCallback) => void;
    // "game:leave": (payload: any) => void;

    "game:request-state": (payload: GameRequestStateRequest, callback: GenericCallback) => void;

    "game:chat:send": (payload: GameChatSendRequest, callback: GenericCallback) => void;

    "game:move:send": (payload: GameMoveSendRequest, callback: GenericCallback) => void;
    "game:move:bluff:call": (payload: GameMoveBluffCallRequest, callback: GenericCallback) => void;
    "game:move:bluff:choose-piece": (payload: GameMoveBluffChoosePieceRequest) => void;

    "game:resign": (payload: GameResignRequest, callback: GenericCallback) => void;

    "game:draw:offer": (payload: GameDrawOfferRequest, callback: GenericCallback) => void;
    "game:draw:cancel-offer": (payload: GameDrawCancelOfferRequest, callback: GenericCallback) => void;
    "game:draw:accept": (payload: GameDrawAcceptRequest, callback: GenericCallback) => void;
    "game:draw:decline": (payload: GameDrawDeclineRequest, callback: GenericCallback) => void;

    "game:rematch:offer": (payload: GameRematchOfferRequest, callback: GenericCallback) => void;
    "game:rematch:cancel-offer": (payload: GameRematchCancelOfferRequest, callback: GenericCallback) => void;
    "game:rematch:accept": (payload: GameRematchAcceptRequest, callback: GenericCallback) => void;
    "game:rematch:decline": (payload: GameRematchDeclineRequest, callback: GenericCallback) => void;
}

export interface ServerToClientEvents {
    "game:chat:message": (payload: GameChatMessageResponse) => void;

    "game:player:joined": (payload: GamePlayerJoinedResponse) => void;
    "game:player:state": (payload: GamePlayerStateResponse) => void;

    "game:aborted": (payload: GameAbortedResponse) => void;

    "game:state": (payload: GameStateResponse) => void;
    "game:started": (payload: GameStartedResponse) => void;

    "game:move:applied": (payload: GameMoveAppliedResponse) => void;
    "game:move:bluff:call-succeeded": (payload: GameMoveBluffCallSucceededResponse) => void;
    "game:move:bluff:call-failed": (payload: GameMoveBluffCallFailedResponse) => void;
    "game:move:bluff:lost-piece": (payload: GameMoveBluffLostPieceResponse) => void;

    "game:clock:started": (payload: GameClockStartedResponse) => void;
    "game:clock:state": (payload: GameClockStateResponse) => void;

    "game:draw:offered": (payload: GameDrawOfferedResponse) => void;
    "game:draw:cancelled": (payload: GameDrawCancelledResponse) => void;
    "game:draw:declined": (payload: GameDrawDeclinedResponse) => void;

    "game:rematch:offered": (payload: GameRematchOfferedResponse) => void;
    "game:rematch:cancelled": (payload: GameRematchCancelledResponse) => void;
    "game:rematch:accepted": (payload: GameRematchAcceptedResponse) => void;
    "game:rematch:declined": (payload: GameRematchDeclinedResponse) => void;

    "game:over": (payload: GameOverResponse) => void;
}