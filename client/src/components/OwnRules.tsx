import {Color} from "@chess-bs/common"

import {pieceImages} from "../assets/pieceImages.ts";
import Rule from "@chess-bs/common/src/rule.js";

/** The current player's secret rules, with full descriptions */
function OwnRules({ ruleIds, color }: {ruleIds: number[], color: Color}) {

    const rules = Rule.getRulesFromIds(ruleIds);

    if (!rules?.length) {
        return <div className={"flex items-center justify-center h-full p-4 text-sm text-fg-3/70"}>No rules</div>
    }

    return (<div className={"h-full overflow-y-auto p-2"}>
        <div className={"flex flex-col gap-2"}>
            {rules.map((rule: Rule, index) => {
                const pieceString: string = "" + color + rule.pieceType;

                return <div key={index} className={"flex flex-row gap-3 rounded-lg bg-bg-1/50 border border-white/5 p-2.5"}>
                    {/* Piece-type icon */}
                    <div className={"shrink-0 flex items-center justify-center w-10 h-10 rounded-md bg-white/5"}>
                        <img src={pieceImages[pieceString]} alt={rule.pieceType} width={34} height={34} draggable={false} className={"pointer-events-none"}/>
                    </div>

                    {/* Rule name + description */}
                    <div className={"min-w-0"}>
                        <div className={"font-semibold text-sm text-fg-2"}>{rule.name}</div>
                        <div className={"text-xs text-fg-3 leading-snug mt-0.5"}>{rule.description}</div>
                    </div>
                </div>
            })}
        </div>

    </div>)
}


export default OwnRules;