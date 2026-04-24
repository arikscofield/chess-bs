import {type Color} from "@common/src/types.js";
import Rule, {allRules} from "@common/src/rule.js";
import type {GamePlayerStateResponse} from "@common/src/index.js";
import {getUserById} from "./db/helper.js";

class Player {
    userId: string;
    username: string;
    color: Color;
    rules: Rule[];


    constructor(userId: string, color: Color, rules?: Rule[], username?: string) {
        this.userId = userId;

        this.color = color;
        if (rules) {
            this.rules = rules;
        } else {
            this.rules = [];
        }
        if (username) {
            this.username = username;
        } else {
            this.username = "";
            getUserById(userId).then(user => {
                this.username = user?.username ?? "";
            });
        }
    }

    public setRandomRules(count: number, rulePool: Rule[]) {
        this.rules = Rule.getRandomRules(count, rulePool);
    }

    public getState(): GamePlayerStateResponse {
        return {
            userId: this.userId,
            color: this.color,
            ruleIds: this.rules.map((rule) => rule.id),
        }
    }
}


export default Player;