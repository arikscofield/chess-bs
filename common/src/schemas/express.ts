import { z } from "zod";
import {GameDTOSchema, UserDTOSchema, ZBluffPunishmentEnum, ZCreateGameColorEnum} from "./common";
import {DEFAULT_RULE_COUNT, MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH} from "../const";




// REQUESTS ---------------

export const RegisterSchema = z.object({
    username: z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH).refine((username) => !username.includes("@"), {
        message: "Username cannot contain '@'",
    }),
    email: z.email().optional(),
    password: z.string(),
});
export type RegisterRequest = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
    usernameOrEmail: z.string().nonempty(),
    password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginSchema>;

export const CreateGameSchema = z.object({
    color: ZCreateGameColorEnum,
    bluffPunishment: ZBluffPunishmentEnum,
    ruleCount: z.coerce.number().int().positive().default(DEFAULT_RULE_COUNT),
    rulePoolIds: z.array(z.coerce.number().int().nonnegative()),
    usesClock: z.boolean().default(false),
    clockStartSeconds: z.coerce.number().int().nonnegative().optional(),
    clockIncrementSeconds: z.coerce.number().int().nonnegative().optional(),
});
export type CreateGameRequest = z.infer<typeof CreateGameSchema>;

// PARAMS ----------------

export const GameIdParamSchema = z.object({
    gameId: z.string().min(1, "Game ID required"),
});
export type GameIdParamRequest = z.infer<typeof GameIdParamSchema>;

export const UserIdParamSchema = z.object({
    userId: z.uuid("Invalid user ID"),
});
export type UserIdParamRequest = z.infer<typeof UserIdParamSchema>;


// QUERIES ---------------
export const PaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().default(10),
});
export type PaginationQueryRequest = z.infer<typeof PaginationQuerySchema>;



// RESPONSES ---------------

export const AuthMeResponseSchema = z.object({
    userId: z.uuid(),
})
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

export const RegisterResponseSchema = z.object({
    message: z.string(),
})
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export const LoginResponseSchema = z.object({
    message: z.string(),
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const LogoutResponseSchema = z.object({
    message: z.string(),
})
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export const CreateGameResponseSchema = z.object({
    gameId: z.string(),
})
export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>;

export const GetGameResponseSchema = GameDTOSchema;
export type GetGameResponse = z.infer<typeof GetGameResponseSchema>;

export const GetUserGamesResponseSchema = z.object({
    games: z.array(GameDTOSchema),
    // TODO: Add more meta data, and possibly totalGames?
});
export type GetUserGamesResponse = z.infer<typeof GetUserGamesResponseSchema>;

export const GetUserResponseSchema = UserDTOSchema;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;


