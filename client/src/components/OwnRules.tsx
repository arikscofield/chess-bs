import {Color} from "@chess-bs/common"

import {pieceImages} from "../assets/pieceImages.ts";
import Rule from "@chess-bs/common/src/rule.js";

function OwnRules({ ruleIds, color }: {ruleIds: number[], color: Color}) {

    const rules = Rule.getRulesFromIds(ruleIds);

    return (<div className={"w-full h-full rounded-md bg-bg-2 text-white"}>
        <div className={"flex flex-col justify-between gap-2 h-full overflow-y-auto"}>
            {rules?.map((rule: Rule, index) => {
                const pieceString: string = "" + color + rule.pieceType;

                return <div key={index} className={"flex flex-col p-2 rounded-md "}>
                    <div className={"flex flex-row items-center"}>
                        <img src={pieceImages[pieceString]} alt={pieceString} width={40} height={40} draggable={false} className={"z-20 pointer-events-none "}/>
                        <div className={"font-bold text-md"}>{rule.name}</div>
                    </div>
                    <div className={"px-1 text-sm"}>{rule.description}</div>
                </div>
            })}
        </div>

    </div>)
}


export default OwnRules;