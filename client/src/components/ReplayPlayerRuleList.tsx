import Rule from "@chess-bs/common/src/rule.js";
import {Chip, Tooltip} from "@mantine/core";
import {pieceImages} from "../assets/pieceImages.ts";
import {Color} from "@chess-bs/common";


function ReplayPlayerRuleList(
    {color, playerRuleIds, className=""}:
    {color: Color, playerRuleIds: number[], className?: string}
) {



    return (
        <div className={"flex flex-row justify-between gap-1  " + className}>
            {playerRuleIds.map((ruleId, i) => {
                const rule = Rule.getRuleFromId(ruleId);
                if (!rule) return;

                const pieceIconString = "" + color + rule.pieceType;

                return <div key={i}>
                    <Tooltip
                        label={rule.description}
                        transitionProps={{ transition: "pop", duration: 300 }}
                        events={{ hover: true, focus: true, touch: true }}
                        openDelay={150}
                    >
                        <div>
                            <Chip
                                size={"sm"}
                                checked={true}
                                icon={<img src={pieceImages[pieceIconString]} alt={pieceIconString}></img>}
                                styles={{ label: { cursor: "default"} }}
                                color={"var(--color-fg-1)"}
                            >
                                {rule.name}
                            </Chip>
                        </div>

                    </Tooltip>
                </div>
            })}
        </div>
    )
}



export default ReplayPlayerRuleList;