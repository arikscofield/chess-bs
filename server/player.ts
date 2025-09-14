import {Color, type Rule} from "@chess-bs/common";


export class Player {
    color: Color;
    rules: Rule[];


    constructor(color: Color, rules: Rule[]) {
        this.color = color;
        this.rules = rules;
    }
}