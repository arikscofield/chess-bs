

import {allRules, Color, PieceType} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import {Chip, type MantineSize, Tooltip} from "@mantine/core";
import Rule from "@chess-bs/common/src/rule.js";

function RuleList(
    { enabledRuleIds, setEnabledRuleIds, size = "sm", color = Color.White, onlyShowEnabled = false, wrapChips = false }:
    { enabledRuleIds: number[], setEnabledRuleIds?: (enabledRuleIds: number[]) => void, size?: MantineSize, color?: Color, onlyShowEnabled?: boolean, wrapChips?: boolean }
) {

    const enabledRules = Rule.getRulesFromIds(enabledRuleIds);


    return (<div className={"@container h-full overflow-auto"}>
        <div className={"flex flex-col h-full"} >
            {Object.values(PieceType).map((pieceType, pieceTypeIndex) => {
                const pieceString: string = "" + color + pieceType;

                return <div key={pieceType} className={`flex flex-row flex-1 w-full items-center pl-2 overflow-y-auto 
                ${wrapChips ? "flex-wrap" : ""}
                border-gray-400/70 ${pieceTypeIndex === 0 ? "border-b-1" : pieceTypeIndex === Object.values(PieceType).length - 1 ? "border-t-1" : "border-y-1"} 
                `}>
                    <img src={pieceImages[pieceString]} alt={pieceString}
                         width={size === "xs" ? "30"
                             : size === "sm" ? "40"
                             : size === "md" ? "50"
                             : "60"
                        }
                    />
                    {/* TODO: Sort allRules so that the enabled ones are first */}
                    {allRules.filter((rule: Rule) => rule.pieceType === pieceType && (!onlyShowEnabled || enabledRules.some(r => r.name === rule.name))).map((rule: Rule) => (
                        <div key={rule.name} className={"m-1"}>
                            <Tooltip
                                label={rule.description}
                                transitionProps={{ transition: "pop", duration: 300 }}
                                events={{ hover: true, focus: true, touch: true }}
                                openDelay={150}
                            >
                                <div>
                                    <Chip
                                        size={size}
                                        checked={enabledRules.some(r => r.name === rule.name)}
                                        onChange={(checked) => {
                                            if (!setEnabledRuleIds) return;
                                            if (checked) {
                                                setEnabledRuleIds([...enabledRuleIds, rule.id]);
                                            } else {
                                                setEnabledRuleIds(enabledRuleIds.filter(id => id !== rule.id));
                                            }
                                        }}
                                        disabled={!setEnabledRuleIds && !enabledRuleIds.some(id => id === rule.id)}
                                        styles={{ label: !setEnabledRuleIds ? { cursor: "default"} : {} }}
                                        color={"var(--color-fg-1)"}
                                    >
                                        {rule.name}
                                    </Chip>
                                </div>

                            </Tooltip>
                                {/*<IoInformationCircleOutline size={25} />*/}

                        </div>
                    ))}
                </div>
            })}
        </div>

    </div>)
}


export default RuleList;