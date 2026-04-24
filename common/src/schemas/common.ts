import { z } from "zod";
import {Color, PieceType, CreateGameColor, BluffPunishment, GameStatus, GameResult} from "../types";


export const ZPieceTypeEnum = z.enum(PieceType);
export const ZColorEnum = z.enum(Color);
export const ZCreateGameColorEnum = z.enum(CreateGameColor);
export const ZBluffPunishmentEnum = z.enum(BluffPunishment);
export const ZGameStatusEnum = z.enum(GameStatus);
export const ZGameResultEnum = z.enum(GameResult);


export const SquareSchema = z.object({
    row: z.number().int(),
    col: z.number().int(),
});
export type Square = z.infer<typeof SquareSchema>;

export const PieceSchema = z.object({
    pieceType: ZPieceTypeEnum,
    color: ZColorEnum,
    hasMoved: z.boolean(),
});
export type Piece = z.infer<typeof PieceSchema>;

export const MoveSchema = z.object({
    from: SquareSchema,
    to: SquareSchema,
    piece: z.object({
        type: ZPieceTypeEnum,
        color: ZColorEnum,
    }),
    promotion: ZPieceTypeEnum.optional(),
    bluff: z.boolean().optional(),
    timestamp: z.int().positive().optional(),
    notation: z.string().optional(),
})
export type Move = z.infer<typeof MoveSchema>;

export const CallBluffSchema = z.object({
    callerColor: ZColorEnum,
    successful: z.boolean(),
    timestamp: z.int().positive().optional(),
})
export type CallBluff = z.infer<typeof CallBluffSchema>;

export const TurnSchema = z.union([MoveSchema, CallBluffSchema]);
export type Turn = z.infer<typeof TurnSchema>;


const getLegalMovesSchema = z.function({
    input: []
})

export const UserDTOSchema = z.object({
    userId: z.string(),
    username: z.string(),
});
export type UserDTO = z.infer<typeof UserDTOSchema>;

export const PlayerDTOSchema = z.object({
    userId: z.string(),
    username: z.string(),
    color: ZColorEnum,
    ruleIds: z.array(z.number().int()).optional(),
    clockMs: z.number().int().optional(),
})
export type PlayerDTO = z.infer<typeof PlayerDTOSchema>;

export const RuleSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.string(),
    pieceType: ZPieceTypeEnum,
});
export type Rule = z.infer<typeof RuleSchema>;

export const BoardSchema = z.object({
    grid: z.array(z.array(z.union([PieceSchema, z.null()]))),
    enPassant: SquareSchema.nullable(),
});
export type Board = z.infer<typeof BoardSchema>;

export const BoardDTOSchema = z.object({
    grid: z.array(z.array(z.union([PieceSchema, z.null()]))),
    enPassant: SquareSchema.nullable(),
});
export type BoardDTO = z.infer<typeof BoardDTOSchema>;

export const ClockInfoSchema = z.object({
    usesClock: z.boolean(),
    startMs: z.number().int().positive(),
    incrementMs: z.number().int().positive(),
    gameStartTimestamp: z.int().positive(),
})
export type ClockInfo = z.infer<typeof ClockInfoSchema>;

export const GameDTOSchema = z.object({
    gameId: z.string(),
    gameStatus: ZGameStatusEnum,
    startBoard: BoardDTOSchema,
    rulePoolIds: z.array(z.number().int()),
    turnHistory: z.array(TurnSchema),
    usesClock: z.boolean(),
    clockStartMs: z.number().int().nullable(),
    clockIncrementMs: z.number().int().nullable(),
    bluffPunishment: ZBluffPunishmentEnum,

    players: z.array(PlayerDTOSchema),


});
export type GameDTO = z.infer<typeof GameDTOSchema>;



