import {finishedGamesTable} from "./schema.js";
import {eq} from "drizzle-orm";
import {drizzle} from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";
import Game from "../game.js";
import {type ReplayInfo} from "@common/src/index.js";
import Rule from "@common/src/rule.js";



const db = drizzle(process.env.DATABASE_URL!, { schema });

export async function getFinishedGameFromId(gameId: string): Promise<ReplayInfo | null> {
    const finishedGameRows = await db
        .select()
        .from(finishedGamesTable)
        .where(eq(finishedGamesTable.gameId, gameId))
        .limit(1);

    if (finishedGameRows.length <= 0) {
        return null;
    }

    const finishedGame = finishedGameRows[0]

    if (!finishedGame) return null;

    return {
        startGrid: finishedGame.startBoard.grid,
        rulePool: finishedGame.rulePoolIds.map((ruleId) => Rule.getRuleFromId(ruleId)).filter((rule) => rule !== undefined),
        usesTimer: finishedGame.usesTimer,
        timerStartMs: finishedGame.timerStartMs,
        timerIncrementMs: finishedGame.timerIncrementMs,
        gameStartTimestamp: finishedGame.startTimestamp,
        turnHistory: finishedGame.turnHistory,
        bluffPunishment: finishedGame.bluffPunishment,
    }
}

export async function saveFinishedGame(game: Game): Promise<boolean> {
    const finishedGame: typeof finishedGamesTable.$inferInsert = {
        gameId: game.gameId,
        startBoard: game.startBoard,
        players: game.players.map((player) => {
            return { playerId: player.playerId, color: player.color, ruleIds: player.rules.map((rule) => rule.id) };
        }),
        rulePoolIds: game.rulePool.map((rule) => rule.id),
        turnHistory: game.turnHistory,
        bluffPunishment: game.bluffPunishment,

        usesTimer: game.usesTimer,
        startTimestamp: game.gameStartTimestamp,
        timerStartMs: game.timeStartMs,
        timerIncrementMs: game.timeIncrementMs,
    }

    try {
        await db.insert(finishedGamesTable).values(finishedGame);
        console.log(`Saved game ${game.gameId} to db`)
        return true;
    } catch (exception) {
        console.error(exception);
        console.log(`Failed to save game ${game.gameId}`, game);
        return false;
    }

}