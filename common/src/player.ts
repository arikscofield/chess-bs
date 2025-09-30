import {type Color, type Rule as RuleType, type Player as PlayerType, PlayerState} from "./types";
import Rule, {allRules} from "./rule";

class Player implements PlayerType {
    playerId: string;
    color: Color;
    rules: Rule[];


    constructor(playerId: string, color: Color, rules?: Rule[]) {
        this.playerId = playerId;
        this.color = color;
        if (rules) {
            this.rules = rules;
        } else {
            this.rules = [];
        }
    }

    public setRandomRules(count: number, rulePool: Rule[]) {
        this.rules = Rule.getRandomRules(count, rulePool);
    }


    public getState(): PlayerState {
        return {
            playerId: this.playerId,
            color: this.color,
            rules: this.rules,
        }
    }


    public static fromPlayerState(state: PlayerState): Player {
        const {playerId, color, rules} = state;
        const player = new Player(playerId, color);

        const newRules: Rule[] = [];
        for (const playerRule of rules) {
            for (const rule of allRules) {
                if (playerRule.name === rule.name) {
                    const newRule = new Rule(playerRule.name, playerRule.description, playerRule.pieceType, rule.getLegalMoves);
                    newRules.push(newRule);
                }
            }
        }
        player.rules = newRules;

        return player;
    }
}


export default Player;