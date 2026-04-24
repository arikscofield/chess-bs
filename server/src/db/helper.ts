import {
    games,
    type User,
    type Game as DBGame,
    users,
    type Session,
    sessions,
    type NewUser,
    type NewSession, gamesToPlayers, type GameToPlayer
} from "./schema.js";
import {count, desc, eq} from "drizzle-orm";
import {drizzle} from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";
import Game from "../game.js";
import {Color, UserType} from "@common/src/index.js";



const db = drizzle(process.env.DATABASE_URL!, { schema });



// USERS -----------------------------------

export async function addUser(user: NewUser): Promise<boolean> {
    if (user.userType !== UserType.Guest && !user.password) {
        throw new Error("Password is required for non-guest users");
    }

    try {
        await db.insert(users).values(user)
        console.log(`Added user ${user.id} (${user.username}) to db`);
        return true;
    } catch (exception) {
        console.error(` Failed to add user ${user.id} (${user.username}):`, exception);
        return false;
    }
}



export async function getUserById(userId: string): Promise<User | null> {
    const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (rows.length <= 0 || rows[0] === undefined) {
        return null;
    }

    return rows[0];
}

export async function getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    let user: User | null = null;
    if (usernameOrEmail.includes("@")) {
        const rows = await db.select().from(users).where(eq(users.email, usernameOrEmail)).limit(1);
        if (rows.length >= 0 && rows[0] !== undefined) {
            user = rows[0];
        }
    } else {
        const rows = await db.select().from(users).where(eq(users.username, usernameOrEmail)).limit(1);
        if (rows.length >= 0 && rows[0] !== undefined) {
            user = rows[0];
        }
    }
    return user
}


export async function emailAvailable(email: string): Promise<boolean> {
    const rows = await db.select({ count: count() }).from(users).where(eq(users.email, email))

    return (rows[0]?.count ?? 0) === 0;
}


// SESSIONS -----------------------------------

export async function getSessionByToken(token: string): Promise<Session | null> {
    const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);

    if (session.length <= 0 || session[0] === undefined) {
        return null;
    }

    return session[0];
}

export async function saveSession(session: NewSession): Promise<boolean> {
    try {
        await db.insert(sessions).values(session);
        return true;
    } catch (exception) {
        console.error(exception);
        return false;
    }
}

export async function deleteSessionByToken(token: string): Promise<boolean> {
    try {
        await db.delete(sessions).where(eq(sessions.token, token));
        return true;
    } catch (exception) {
        console.error(exception);
    }
    return false;
}


// GAMES -----------------------------------

export async function getFinishedGameById(gameId: string): Promise<DBGame | null> {
    const rows = await db
        .select()
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1);

    if (rows.length <= 0 || rows[0] === undefined) {
        return null;
    }

    return rows[0];
}

export async function saveFinishedGame(game: Game): Promise<boolean> {
    const finishedGame: typeof games.$inferInsert = {
        id: game.gameId,
        startBoard: game.startBoard,
        // players: game.players.map((player) => {
        //     return { playerId: player.playerId, color: player.color, ruleIds: player.rules.map((rule) => rule.id) };
        // }),
        rulePoolIds: game.rulePool.map((rule) => rule.id),
        turnHistory: game.turnHistory,
        bluffPunishment: game.bluffPunishment,

        usesClock: game.usesClock,
        startTimestamp: game.gameStartTimestamp,
        clockStartMs: game.clockStartMs,
        clockIncrementMs: game.clockIncrementMs,
    }

    try {
        await db.insert(games).values(finishedGame);
        console.log(`Saved game ${game.gameId} to db`)
        return true;
    } catch (exception) {
        console.error(exception);
        console.log(`Failed to save game ${game.gameId}`, game);
        return false;
    }

}


// USER GAME -----------------------------------

export async function getUserGames(userId: string, page: number, pageSize: number): Promise<DBGame[]> {
    const userGames: DBGame[] = [];

    await db
        .select()
        .from(gamesToPlayers)
        .innerJoin(games, eq(gamesToPlayers.gameId, games.id))
        .where(eq(gamesToPlayers.userId, userId))
        .orderBy(desc(games.startTimestamp), desc(games.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize)


    return userGames;
}


// Get the players in a particular game
export async function getPlayersFromGame(gameId: string): Promise<GameToPlayer[]> {
    const players = await db
        .select()
        .from(gamesToPlayers)
        .where(eq(gamesToPlayers.gameId, gameId))
        .orderBy(desc(gamesToPlayers.userId));

    return players;
}


// Get the players in a particular game, with the full user object
export async function getPlayersFromGameWithUser(gameId: string): Promise<{user: User, color: Color, ruleIds: number[]}[]> {
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
}










