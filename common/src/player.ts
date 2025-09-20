import {type Color, type Rule as RuleType, type Player as PlayerType, PlayerState} from "./types";
import Rule, {allRules} from "./rule";

class Player implements PlayerType {
    playerId: string;
    color: Color;
    rules: RuleType[];


    constructor(playerId: string, color: Color, ruleCount: number) {
        this.playerId = playerId;
        this.color = color;
        this.rules = Rule.getRandomRules(ruleCount);
    }


    public getState(): PlayerState {
        return {
            playerId: this.playerId,
            color: this.color,
            rules: this.rules,
        }
    }



    public static from(player: Player) {
        const newRules: Rule[] = [];
        for (const playerRule of player.rules) {
            for (const rule of allRules) {
                if (playerRule.name === rule.name) {
                    newRules.push(rule);
                }
            }
        }

        const newPlayer = new Player(player.playerId, player.color, player.rules.length);
        newPlayer.rules = newRules;
        return newPlayer;
    }


    public static fromPlayerState(state: PlayerState): Player {
        const {playerId, color, rules} = state;
        const player = new Player(playerId, color, rules.length);

        const newRules: Rule[] = [];
        for (const playerRule of player.rules) {
            for (const rule of allRules) {
                if (playerRule.name === rule.name) {
                    newRules.push(rule);
                }
            }
        }
        player.rules = newRules;

        return player;
    }
}


export default Player;