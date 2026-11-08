

import {allRules, Color, PieceType} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import {Chip, type MantineSize, Tooltip} from "@mantine/core";
import Rule from "@chess-bs/common/src/rule.js";

/**
 * Rule list grouped by piece type. Toggle editable chips with `setEnabledRuleIds`
 */
function RuleList(
    { enabledRuleIds, setEnabledRuleIds, size = "sm", color = Color.White, onlyShowEnabled = false, wrapChips = false }:
    { enabledRuleIds: number[], setEnabledRuleIds?: (enabledRuleIds: number[]) => void, size?: MantineSize, color?: Color, onlyShowEnabled?: boolean, wrapChips?: boolean }
) {
    const editable = !!setEnabledRuleIds;
    const iconSize = size === "xs" ? 32 : size === "sm" ? 40 : 48;

    const rows = Object.values(PieceType)
        .map(pieceType => ({
            pieceType,
            rules: allRules.filter((rule: Rule) =>
                rule.pieceType === pieceType && (!onlyShowEnabled || enabledRuleIds.includes(rule.id))),
        }))
        .filter(row => row.rules.length > 0);


    if (rows.length === 0) {
        return <div className={"flex items-center justify-center h-full p-4 text-sm text-fg-3/70"}>No rules</div>
    }

    return (<div className={"h-full overflow-auto"}>
        <div className={"flex flex-col h-full  divide-y divide-white/8"} >
            {rows.map(({pieceType, rules}) => {
                const pieceString: string = "" + color + pieceType;

                return <div key={pieceType} className={"flex flex-row w-full items-center gap-2 px-2 py-1.5"}>
                    <img src={pieceImages[pieceString]} alt={pieceString} width={iconSize} height={iconSize} draggable={false} className={"shrink-0"}/>
                    <div className={`flex flex-row gap-1.5 grow ${wrapChips ? "flex-wrap" : "overflow-x-auto"}`}>
                        {rules.map((rule: Rule) => {
                            const enabled = enabledRuleIds.includes(rule.id);

                            return <Tooltip
                                key={rule.id}
                                label={rule.description}
                                transitionProps={{transition: "pop", duration: 300}}
                                multiline
                                maw={260}
                                events={{hover: true, focus: true, touch: true}}
                                openDelay={150}
                            >
                                {editable
                                    ? <div>
                                        <Chip
                                            size={size}
                                            checked={enabled}
                                            onChange={(checked) => {
                                                if (checked) {
                                                    setEnabledRuleIds([...enabledRuleIds, rule.id]);
                                                } else {
                                                    setEnabledRuleIds(enabledRuleIds.filter(id => id !== rule.id));
                                                }
                                            }}
                                        >
                                            {rule.name}
                                        </Chip>
                                    </div>
                                    : <span
                                        tabIndex={0}
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-help outline-none focus-visible:ring-2 focus-visible:ring-fg-1
                                            ${enabled ? "bg-fg-1/15 text-fg-1" : "bg-white/5 text-fg-3/60 line-through"}`}
                                    >
                                        {rule.name}
                                    </span>}
                            </Tooltip>
                        })}
                    </div>

                </div>
            })}
        </div>

    </div>)
}


export default RuleList;