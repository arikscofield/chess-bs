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
            ruleIds: this.rules.map((rule) => rule.id),
        }
    }


    public static fromPlayerState(state: PlayerState): Player {
        const {playerId, color, ruleIds} = state;
        const player = new Player(playerId, color);

        player.rules = ruleIds.map((ruleId) => Rule.getRuleFromId(ruleId)).filter((r) => r !== undefined)


        return player;
    }
}


export default Player;