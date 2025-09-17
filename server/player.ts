import {type Color, type Rule} from "@chess-bs/common";


export class Player {
    playerId: string;
    color: Color;
    rules: Rule[];


    constructor(playerId: string, color: Color, rules: Rule[]=[]) {
        this.playerId = playerId;
        this.color = color;
        this.rules = rules;
    }
}