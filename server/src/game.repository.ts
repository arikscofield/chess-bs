import type Game from "./game.js";
import {GameVisibility, type PublicGamesQueryRequest} from "@chess-bs/common";

export class InMemoryGameRepository {
    private readonly games: Map<string, Game> = new Map();
    private readonly publicGames: Set<string> = new Set();


    getById(id: string): Game | undefined {
        return this.games.get(id);
    }

    getPublicGames(filter: PublicGamesQueryRequest) {
        const all = [...this.publicGames]
            .map(id => this.games.get(id))
            .filter(g => g !== undefined)
            .filter(g => this.matchesFilter(g, filter))
            .sort((a, b) => b.gameCreatedTimestamp - a.gameCreatedTimestamp);

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

        if (usesClock && !game.usesClock) return false;
        if (minStartSeconds && game.clockStartMs && game.clockStartMs * 1000 < minStartSeconds) return false;
        if (maxStartSeconds && game.clockStartMs && game.clockStartMs * 1000 > maxStartSeconds) return false;

        if (minIncrementSeconds && game.clockIncrementMs && game.clockIncrementMs * 1000 < minIncrementSeconds) return false;
        if (maxIncrementSeconds && game.clockIncrementMs && game.clockIncrementMs * 1000 > maxIncrementSeconds) return false;

        if (minRuleCount && game.ruleCount < minRuleCount) return false;
        if (maxRuleCount && game.ruleCount > maxRuleCount) return false;

        if (bluffPunishment && game.bluffPunishment !== bluffPunishment) return false;

        if (creatorColor && game.creatorColor !== creatorColor) return false;

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
}