import {type Color, allRules} from "@chess-bs/common";
import Rule from "@chess-bs/common/dist/rule.js"
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
}


export default Player;