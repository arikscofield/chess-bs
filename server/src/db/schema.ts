import {
    bigint,
    boolean,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    primaryKey,
    index,
} from "drizzle-orm/pg-core";
// import {BluffPunishment, Color, type Turn, type Piece, type Square, UserType} from "@common/dist/index.js"
import {BluffPunishment, Color, type Turn, type Piece, type Square, UserType} from "@chess-bs/common"
import { defineRelations } from 'drizzle-orm';
import {createInsertSchema} from "drizzle-orm/zod";

export const bluffPunishmentEnum = pgEnum("bluffPunishment",
    [BluffPunishment.Turn, BluffPunishment.Piece, BluffPunishment.PieceOpponent, BluffPunishment.PieceRandom]
)

export const colorEnum = pgEnum("color", Object.values(Color) as [string, ...string[]]);

export const userTypeEnum = pgEnum("userType", Object.values(UserType) as [string, ...string[]])

type PlayerData = {
    playerId: string;
    color: Color;
    ruleIds: number[];
}

type BoardData = {
    grid: (Piece | null)[][];
    enPassant: Square | null;
}


export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    username: text("username").notNull(),
    email: text("email").unique(),
    password: text("password"),
    userType: userTypeEnum("user_type").default(userTypeEnum.enumValues[0]).notNull(),
});

export const games = pgTable("finished_games", {
    id: text("id").primaryKey().notNull(),

    startBoard: jsonb("start_board").$type<BoardData>().notNull(),
    rulePoolIds: integer("rule_pool_ids").array().notNull(),
    turnHistory: jsonb("turn_history").$type<Turn[]>().notNull(),
    bluffPunishment: bluffPunishmentEnum("bluff_punishment").notNull(),

    usesClock: boolean("uses_clock").default(false).notNull(),
    startTimestamp: timestamp("start_timestamp", { withTimezone: true }).defaultNow().notNull(),
    clockStartMs: integer("clock_start_ms").default(0).notNull(),
    clockIncrementMs: integer("clock_increment_ms").default(0).notNull(),
}, (table) => [
    index("games_start_timestamp_idx").on(table.startTimestamp, table.id)
]);


export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
});


export const gamesToPlayers = pgTable("games_to_players", {
    userId: uuid("user_id").notNull().references(() => users.id),
    gameId: text("game_id").notNull().references(() => games.id),

    color: colorEnum("color").notNull(),
    ruleIds: integer("rule_ids").array().notNull(),
}, (table) => [
    primaryKey({ columns: [table.userId, table.gameId] }),
    index('games_to_players_user_id_idx').on(table.userId),
    index('games_to_players_game_id_idx').on(table.gameId),
    index('games_to_players_composite_id_idx').on(table.userId, table.gameId),
]);


// Database types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameToPlayer = typeof gamesToPlayers.$inferSelect;
export type NewGameToPlayer = typeof gamesToPlayers.$inferInsert;

// Schema Validators
export const userInsertSchema = createInsertSchema(users);


// Relations -------------------------------------

export const relations = defineRelations({ users, games, gamesToPlayers },
    (r) => ({
        users: {
            games: r.many.games({
                from: r.users.id.through(r.gamesToPlayers.userId),
                to: r.games.id.through(r.gamesToPlayers.gameId),
            }),
        },
        games: {
            players: r.many.users(),
        }
}));





