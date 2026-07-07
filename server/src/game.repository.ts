import type Game from "./game.js";
import {
    BluffPunishment,
    CreateGameColor,
    GameVisibility,
    PublicGameSortBy, SortDir,
    type PublicGamesQueryRequest
} from "@chess-bs/common";


const bluffPunishmentKeys: Record<BluffPunishment, number> = {
    [BluffPunishment.Turn]: 0,
    [BluffPunishment.Piece]: 1,
    [BluffPunishment.PieceRandom]: 2,
    [BluffPunishment.PieceOpponent]: 3,
}

const creatorColorKeys: Record<CreateGameColor, number> = {
    [CreateGameColor.Random]: 0,
    [CreateGameColor.White]: 1,
    [CreateGameColor.Black]: 2,
}

const sortKeys: Record<PublicGameSortBy, (g: Game) => number> = {
    [PublicGameSortBy.CreatedAt]: g => g.gameCreatedTimestamp,
    [PublicGameSortBy.RuleCount]: g => g.ruleCount,
    [PublicGameSortBy.Clock]: g => (g.clockStartMs ?? 0) + (g.clockIncrementMs ?? 0) * 25,
    [PublicGameSortBy.ClockStart]: g => g.clockStartMs ?? 0,
    [PublicGameSortBy.ClockIncrement]: g => g.clockIncrementMs ?? 0,
    [PublicGameSortBy.BluffPunishment]: g => bluffPunishmentKeys[g.bluffPunishment],
    [PublicGameSortBy.CreatorColor]: g => creatorColorKeys[g.creatorColor],
}


export class InMemoryGameRepository {
    private readonly games: Map<string, Game> = new Map();
    private readonly publicGames: Set<string> = new Set();


    getById(id: string): Game | undefined {
        return this.games.get(id);
    }

    getPublicGames(filter: PublicGamesQueryRequest) {
        const sortKey = sortKeys[filter.sortBy];
        const sortDir = filter.sortDir === SortDir.Asc ? 1 : -1;

        const all = [...this.publicGames]
            .map(id => this.games.get(id))
            .filter(g => g !== undefined)
            .filter(g => g.players.length < g.maxPlayers)
            .filter(g => this.matchesFilter(g, filter))
            .sort((a, b) => (sortKey(a) - sortKey(b)) * sortDir);

        const start = filter.page * filter.pageSize;
        return {
            games: all.slice(start, start + filter.pageSize).map(g => g.getGameDTO()),
            total: all.length,
            page: filter.page,
            pageSize: filter.pageSize
        }
    }

    private matchesFilter(game: Game, filter: PublicGamesQueryRequest) {
        const { usesClock, minStartSeconds, maxStartSeconds, minIncrementSeconds, maxIncrementSeconds, minRuleCount, maxRuleCount, bluffPunishment, creatorColor } = filter;

        if (usesClock !== undefined && ((usesClock && !game.usesClock) || (!usesClock && game.usesClock))) return false;
        if (minStartSeconds !== undefined && game.clockStartMs && game.clockStartMs / 1000 < minStartSeconds) return false;
        if (maxStartSeconds !== undefined && game.clockStartMs && game.clockStartMs / 1000 > maxStartSeconds) return false;

        if (minIncrementSeconds !== undefined && game.clockIncrementMs && game.clockIncrementMs / 1000 < minIncrementSeconds) return false;
        if (maxIncrementSeconds !== undefined && game.clockIncrementMs && game.clockIncrementMs / 1000 > maxIncrementSeconds) return false;

        if (minRuleCount !== undefined && game.ruleCount < minRuleCount) return false;
        if (maxRuleCount !== undefined && game.ruleCount > maxRuleCount) return false;

        if (bluffPunishment !== undefined && game.bluffPunishment !== bluffPunishment) return false;

        if (creatorColor !== undefined && game.creatorColor !== creatorColor) return false;

        return true;
    }

    save(game: Game): void {
        this.games.set(game.gameId, game);
        if (game.gameVisibility === GameVisibility.Public) this.publicGames.add(game.gameId);
    }

    deleteById(id: string): void {
        this.games.delete(id);
        if (this.publicGames.has(id)) this.publicGames.delete(id);
    }

    deleteFromPublicGames(id: string): void {
        if (this.publicGames.has(id)) this.publicGames.delete(id);
    }
}