import * as schema from "./schema.js";
import {
    type Game as DBGame,
    games,
    gamesToPlayers,
    type GameToPlayer,
    type NewGame as NewDBGame, type NewGameToPlayer,
    type NewSession,
    type NewUser,
    type Session,
    sessions,
    type User,
    users
} from "./schema.js";
import {count, desc, eq} from "drizzle-orm";
import {drizzle, NodePgDatabase} from "drizzle-orm/node-postgres";
import Game from "../game.js";
import {BOT_UUID, Color, UserType} from "@chess-bs/common";


let db: NodePgDatabase<typeof schema> | null = null;
if (process.env.DATABASE_URL) {
    db = drizzle(process.env.DATABASE_URL, { schema });
} else {
    console.warn("DATABASE_URL is missing. Running without database.")
}

type DB = NonNullable<typeof db>;


async function withDB<T>(fallback: T, op: (db: DB) => Promise<T>, context?: string): Promise<T> {
    if (!db) {
        if (context) console.warn(`Skipping ${context} - no database connection`);
        return fallback;
    }
    try {
        return await op(db);
    } catch (exception) {
        console.error(`Database operation failed ${context ?? ""}:`, exception);
        return fallback;
    }
}

export function isDBConfigured(): boolean {
    return db !== null;
}

// USERS -----------------------------------

export async function addUser(user: NewUser): Promise<boolean> {
    if (user.userType !== UserType.Guest && !user.password) {
        throw new Error("Password is required for non-guest users");
    }

    return withDB(false, async db => {
        await db.insert(users).values(user)
        console.log(`Added user ${user.id} (${user.username}) to db`);
        return true;
    }, `addUser ${user.id} (${user.username})`);
}



export async function getUserById(userId: string): Promise<User | null> {
    return withDB<User | null>(null, async db => {
        const rows = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        return rows[0] ?? null;
    }, `getUserById(${userId})`);
}

export async function getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    return withDB<User | null>(null, async db => {
        const column = usernameOrEmail.includes("@") ? users.email : users.username;
        const rows = await db.select().from(users).where(eq(column, usernameOrEmail)).limit(1);
        return rows[0] ?? null;
    }, `getUserByUsername(${usernameOrEmail})`);
}


export async function emailAvailable(email: string): Promise<boolean> {
    return withDB(false, async db => {
        const rows = await db.select({ count: count() }).from(users).where(eq(users.email, email))
        return (rows[0]?.count ?? 0) === 0;
    }, `emailAvailable(${email})`);
}


export async function ensureBotUser() {
    if (!isDBConfigured()) return;
    if (await getUserById(BOT_UUID) === null) {
        const botUser: NewUser = {
            username: "Bot",
            id: BOT_UUID,
            userType: UserType.Guest,
        }
        await addUser(botUser);
    }
}


// SESSIONS -----------------------------------

export async function getSessionByToken(token: string): Promise<Session | null> {
    return withDB<Session | null>(null, async db => {
        const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        return session[0] ?? null;
    }, `getSessionByToken(${token})`);
}

export async function saveSession(session: NewSession): Promise<boolean> {
    return withDB(false, async db => {
        await db.insert(sessions).values(session);
        return true;
    }, `saveSession(${JSON.stringify(session)})`);
}

export async function deleteSessionByToken(token: string): Promise<boolean> {
    return withDB(false, async db => {
        await db.delete(sessions).where(eq(sessions.token, token));
        return true;
    }, `deleteSessionByToken(${token})`);
}


// GAMES -----------------------------------

export async function getFinishedGameById(gameId: string): Promise<DBGame | null> {
    return withDB<DBGame | null>(null, async db => {
        const rows = await db
            .select()
            .from(games)
            .where(eq(games.id, gameId))
            .limit(1);

        return rows[0] ?? null;
    }, `getFinishedGameById(${gameId})`);
}

export async function saveFinishedGame(game: Game): Promise<boolean> {
    const finishedGame: NewDBGame = {
        id: game.gameId,
        startBoard: game.startBoard,
        rulePoolIds: game.rulePool.map((rule) => rule.id),
        turnHistory: game.turnHistory,
        bluffPunishment: game.bluffPunishment,
        createdAt: new Date(game.gameCreatedTimestamp),

        usesClock: game.usesClock,
        clockStartMs: game.clockStartMs,
        clockIncrementMs: game.clockIncrementMs,
        clockStartedAt: game.clockStartTimestamp ? new Date(game.clockStartTimestamp) : undefined,
    }

    return withDB(false, async db => {
        await db.insert(games).values(finishedGame);
        if (!(await addGamesToPlayers(game))) return false;
        console.log(`Saved game ${game.gameId} to db`)
        return true;
    }, `saveFinishedGame(${game.gameId})`);

}


// USER GAME -----------------------------------

export async function addGamesToPlayers(game: Game): Promise<boolean> {
    return withDB(false, async db => {
        for (const player of game.players) {
            const gameToPlayer: NewGameToPlayer = {
                userId: player.userId,
                gameId: game.gameId,
                color: player.color,
                ruleIds: player.rules.map((rule) => rule.id),
            };
            await db.insert(gamesToPlayers).values(gameToPlayer);
        }
        return true;
    }, `addGamesToPlayers(${game.gameId})`);
}

export async function getUserGames(userId: string, page: number, pageSize: number): Promise<DBGame[]> {
    return withDB<DBGame[]>([], async db => {
        const rows = await db
            .select({game: games})
            .from(gamesToPlayers)
            .innerJoin(games, eq(gamesToPlayers.gameId, games.id))
            .where(eq(gamesToPlayers.userId, userId))
            .orderBy(desc(games.createdAt), desc(games.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize)
        return rows.map(row => row.game);
    }, `getUserGames(${userId})`);
}


// Get the players in a particular game
export async function getPlayersFromGame(gameId: string): Promise<GameToPlayer[]> {
    return withDB<GameToPlayer[]>([], async db => {
        return db
            .select()
            .from(gamesToPlayers)
            .where(eq(gamesToPlayers.gameId, gameId))
            .orderBy(desc(gamesToPlayers.userId));
    }, `getPlayersFromGame(${gameId})`);
}


// Get the players in a particular game, with the full user object
export async function getPlayersFromGameWithUser(gameId: string): Promise<{user: User, color: Color, ruleIds: number[]}[]> {
    return withDB<{user: User, color: Color, ruleIds: number[]}[]>([], async db => {
        const players = await db
            .select({
                user: users,
                color: gamesToPlayers.color,
                ruleIds: gamesToPlayers.ruleIds,
            })
            .from(gamesToPlayers)
            .innerJoin(users, eq(gamesToPlayers.userId, users.id))
            .where(eq(gamesToPlayers.gameId, gameId))
            .orderBy(desc(gamesToPlayers.userId));

        players.forEach(player => {
            player.user.password = null;
        })

        return players as {user: User, color: Color, ruleIds: number[]}[];
    }, `getPlayersFromGameWithUser(${gameId})`);
}




