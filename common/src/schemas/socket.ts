import { z } from "zod";
import {
    ZColorEnum,
    ZPieceTypeEnum,
    MoveSchema,
    SquareSchema,
    BoardDTOSchema,
    ZGameStatusEnum,
    ZBluffPunishmentEnum, TurnSchema, ZGameResultEnum, PlayerDTOSchema, ClockInfoSchema
} from "./common";


// REQUESTS -----------------------------------------------------------------------------------------------------------


export const GameJoinSchema = z.object({
    gameId: z.string(),
})
export type GameJoinRequest = z.infer<typeof GameJoinSchema>;

export const GameSpectateSchema = z.object({
    gameId: z.string(),
})
export type GameSpectateRequest = z.infer<typeof GameSpectateSchema>;

export const GameRequestStateSchema = z.object({
    gameId: z.string(),
})
export type GameRequestStateRequest = z.infer<typeof GameRequestStateSchema>;

export const GameChatSendSchema = z.object({
    gameId: z.string(),
    message: z.string().min(1, "Message cannot be empty").max(255, "Message cannot be longer than 255 characters")
})
export type GameChatSendRequest = z.infer<typeof GameChatSendSchema>;

export const GameMoveSendSchema = z.object({
    gameId: z.string(),
    move: MoveSchema,
})
export type GameMoveSendRequest = z.infer<typeof GameMoveSendSchema>;


export const GameMoveBluffCallSchema = z.object({
    gameId: z.string(),
})
export type GameMoveBluffCallRequest = z.infer<typeof GameMoveBluffCallSchema>;

export const GameMoveBluffChoosePieceSchema = z.object({
    gameId: z.string(),
    square: SquareSchema,
    piece: ZPieceTypeEnum,
})
export type GameMoveBluffChoosePieceRequest = z.infer<typeof GameMoveBluffChoosePieceSchema>;

export const GameResignSchema = z.object({
    gameId: z.string(),
})
export type GameResignRequest = z.infer<typeof GameResignSchema>;

export const GameDrawOfferSchema = z.object({
    gameId: z.string(),
})
export type GameDrawOfferRequest = z.infer<typeof GameDrawOfferSchema>;

export const GameDrawCancelOfferSchema = z.object({
    gameId: z.string(),
})
export type GameDrawCancelOfferRequest = z.infer<typeof GameDrawCancelOfferSchema>;

export const GameDrawAcceptSchema = z.object({
    gameId: z.string(),
})
export type GameDrawAcceptRequest = z.infer<typeof GameDrawAcceptSchema>;

export const GameDrawDeclineSchema = z.object({
    gameId: z.string(),
})
export type GameDrawDeclineRequest = z.infer<typeof GameDrawDeclineSchema>;

export const GameRematchOfferSchema = z.object({
    gameId: z.string(),
})
export type GameRematchOfferRequest = z.infer<typeof GameRematchOfferSchema>;

export const GameRematchCancelOfferSchema = z.object({
    gameId: z.string(),
})
export type GameRematchCancelOfferRequest = z.infer<typeof GameRematchCancelOfferSchema>;

export const GameRematchAcceptSchema = z.object({
    gameId: z.string(),
})
export type GameRematchAcceptRequest = z.infer<typeof GameRematchAcceptSchema>;

export const GameRematchDeclineSchema = z.object({
    gameId: z.string(),
})
export type GameRematchDeclineRequest = z.infer<typeof GameRematchDeclineSchema>;

// CALLBACKS ------------------------------------



// RESPONSES -----------------------------------------------------------------------------------------------------------


export const GameChatMessageSchema = z.object({
    userId: z.string(),
    username: z.string(),
    message: z.string(),
})
export type GameChatMessageResponse = z.infer<typeof GameChatMessageSchema>;

export const GamePlayerJoinedSchema = z.object({
    userId: z.string(),
    username: z.string(),
})
export type GamePlayerJoinedResponse = z.infer<typeof GamePlayerJoinedSchema>;

// export const GamePlayerState = z.object({
//     userId: z.string(),
//     color: ZColorEnum,
//     ruleIds: z.array(z.number().int()),
// })
export const GamePlayerState = PlayerDTOSchema;
export type GamePlayerStateResponse = z.infer<typeof GamePlayerState>;

export const GameAbortedSchema = z.object({

})
export type GameAbortedResponse = z.infer<typeof GameAbortedSchema>;

export const GameClockStateSchema = ClockInfoSchema;
export type GameClockStateResponse = z.infer<typeof GameClockStateSchema>;

export const GameStateSchema = z.object({
    startBoard: BoardDTOSchema,
    gameStatus: ZGameStatusEnum,
    rulePoolIds: z.array(z.number().int()),
    clock: GameClockStateSchema,
    bluffPunishment: ZBluffPunishmentEnum,
    turnColor: ZColorEnum,
    turnHistory: z.array(TurnSchema),
    players: z.array(PlayerDTOSchema),
    drawOfferedColor: ZColorEnum.nullable().optional(),
})
export type GameStateResponse = z.infer<typeof GameStateSchema>;

export const GameStartedSchema = z.object({
    gameStatus: ZGameStatusEnum,
    startedAt: z.number().int(),
})
export type GameStartedResponse = z.infer<typeof GameStartedSchema>;

export const GameMoveAcceptedSchema = z.object({
    appliedAt: z.number().int(),
})
export type GameMoveAcceptedResponse = z.infer<typeof GameMoveAcceptedSchema>;

export const GameMoveRejectedSchema = z.object({

})
export type GameMoveRejectedResponse = z.infer<typeof GameMoveRejectedSchema>;

export const GameMoveAppliedSchema = z.object({
    move: MoveSchema,
    turnColor: ZColorEnum,
    appliedAt: z.number().int(),
})
export type GameMoveAppliedResponse = z.infer<typeof GameMoveAppliedSchema>;

export const GameMoveBluffCallResultSchema = z.object({
    appliedAt: z.number().int(),
    turnColor: ZColorEnum,
    bluffPunishment: ZBluffPunishmentEnum,
    punished: ZColorEnum,
})
export type GameMoveBluffCallResultResponse = z.infer<typeof GameMoveBluffCallResultSchema>;

export const GameMoveBluffCallSucceededSchema = z.object({
    appliedAt: z.number().int(),
    turnColor: ZColorEnum,
    bluffPunishment: ZBluffPunishmentEnum,
    punished: ZColorEnum,
    turn: TurnSchema,
})
export type GameMoveBluffCallSucceededResponse = z.infer<typeof GameMoveBluffCallSucceededSchema>;

export const GameMoveBluffCallFailedSchema = z.object({
    appliedAt: z.number().int(),
    turnColor: ZColorEnum,
    bluffPunishment: ZBluffPunishmentEnum,
    punished: ZColorEnum,
    turn: TurnSchema,
})
export type GameMoveBluffCallFailedResponse = z.infer<typeof GameMoveBluffCallFailedSchema>;

export const GameMoveBluffLostPieceSchema = z.object({
    appliedAt: z.number().int(),
    turnColor: ZColorEnum,
    square: SquareSchema,
    piece: ZPieceTypeEnum,
    color: ZColorEnum,
})
export type GameMoveBluffLostPieceResponse = z.infer<typeof GameMoveBluffLostPieceSchema>;

export const GameDrawOfferedSchema = z.object({
    offeredBy: ZColorEnum,
})
export type GameDrawOfferedResponse = z.infer<typeof GameDrawOfferedSchema>;

export const GameDrawCanceledSchema = z.object({

})
export type GameDrawCancelledResponse = z.infer<typeof GameDrawCanceledSchema>;

export const GameDrawDeclinedSchema = z.object({

})
export type GameDrawDeclinedResponse = z.infer<typeof GameDrawDeclinedSchema>;

export const GameRematchOfferedSchema = z.object({
    offeredBy: ZColorEnum,
})
export type GameRematchOfferedResponse = z.infer<typeof GameRematchOfferedSchema>;

export const GameRematchCanceledSchema = z.object({

})
export type GameRematchCancelledResponse = z.infer<typeof GameRematchCanceledSchema>;

export const GameRematchAcceptedSchema = z.object({
    newGameId: z.string(),
})
export type GameRematchAcceptedResponse = z.infer<typeof GameRematchAcceptedSchema>;

export const GameRematchDeclinedSchema = z.object({

})
export type GameRematchDeclinedResponse = z.infer<typeof GameRematchDeclinedSchema>;

export const GameOverSchema = z.object({
    result: ZGameResultEnum,
    reason: z.string()
})
export type GameOverResponse = z.infer<typeof GameOverSchema>;








