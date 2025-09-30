import {Color, type Rule} from "@chess-bs/common"

import {pieceImages} from "../assets/pieceImages.ts";

function OwnRules({ rules, color }: {rules: Rule[] | undefined, color: Color}) {



    return (<div className={"w-full h-full flex flex-col rounded-md p-2 gap-2 bg-bg-2 text-white"}>
        <h2 className={"w-full text-center text-xl font-bold"}>Your Rules</h2>

        <div className={"flex flex-col gap-2 overflow-y-auto"}>
            {rules?.map((rule: Rule, index) => {
                const pieceString: string = "" + color + rule.pieceType;

                return <div key={index} className={"flex flex-col p-2 rounded-md border border-white"}>
                    <div className={"flex flex-row items-center"}>
                        <img src={pieceImages[pieceString]} alt={pieceString} width={90} height={90} draggable={false} className={"w-12 h-12 z-20 pointer-events-none "}/>
                        <div className={"font-bold text-lg"}>{rule.name}</div>
                    </div>
                    <div className={"px-1"}>{rule.description}</div>
                </div>
            })}
        </div>

    </div>)
}


export default OwnRules;