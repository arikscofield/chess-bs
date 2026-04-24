import type Game from "./game.js";
// import type {GameID} from "@common/src/index.js";


export class InMemoryGameRepository {
    private readonly games: Map<string, Game> = new Map();


    getById(id: string): Game | undefined {
        return this.games.get(id);
    }


    save(game: Game): void {
        this.games.set(game.gameId, game);
    }

    deleteById(id: string): void {
        this.games.delete(id);
    }
}