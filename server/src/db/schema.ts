import {bigint, boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, varchar} from "drizzle-orm/pg-core";
import {BluffPunishment, Color, type Turn, type Piece, type Square} from "@common/dist/index.js"
import {timestamptz} from "drizzle-orm/gel-core";

export const bluffPunishmentEnum = pgEnum("bluffPunishment",
    [BluffPunishment.Turn, BluffPunishment.Piece, BluffPunishment.PieceOpponent, BluffPunishment.PieceRandom]
)

type PlayerData = {
    playerId: string;
    color: Color;
    ruleIds: number[];
}

type BoardData = {
    grid: (Piece | null)[][];
    enPassant: Square | null;
}

export const finishedGamesTable = pgTable("finished_games", {
    gameId: text("game_id").primaryKey().notNull(),

    startBoard: jsonb("start_board").$type<BoardData>().notNull(),
    players: jsonb().$type<PlayerData[]>().notNull(),
    rulePoolIds: integer("rule_pool_ids").array().notNull(),
    turnHistory: jsonb("turn_history").$type<Turn[]>().notNull(),
    bluffPunishment: bluffPunishmentEnum("bluff_punishment").notNull(),

    usesTimer: boolean("uses_timer").default(false).notNull(),
    startTimestamp: timestamp("start_timestamp", { withTimezone: true }).defaultNow().notNull(),
    timerStartMs: integer("timer_start_ms").default(0).notNull(),
    timerIncrementMs: integer("timer_increment_ms").default(0).notNull(),
});