

import {allRules, Color, PieceType, type Rule} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import {Chip, Tooltip} from "@mantine/core";

function RuleList({ enabledRules, color = Color.White, setEnabledRules }: { enabledRules: Rule[], color?: Color, setEnabledRules?: (enabledRules: Rule[]) => void }) {

    return (<div className={"@container "}>
        <div className={"grid divide-x-2 divide-gray-300 @max-4xl:grid-rows-6 @4xl:grid-cols-6 overflow-auto"} >
            {Object.values(PieceType).map((pieceType) => {
                const pieceString: string = "" + color + pieceType;

                return <div key={pieceType} className={"flex @max-4xl:flex-row @4xl:flex-col flex-1 w-full items-center px-2"}>
                    <img src={pieceImages[pieceString]} alt={pieceString} />
                    {/* TODO: Sort allrules so that the enabled ones are first */}
                    {allRules.filter((rule: Rule) => rule.pieceType === pieceType).map((rule: Rule) => (
                        <div key={rule.name} className={"m-1"}>
                            <Tooltip
                                label={rule.description}
                                transitionProps={{ transition: "pop", duration: 300 }}
                                events={{ hover: true, focus: true, touch: true }}
                                openDelay={150}
                            >
                                <div>
                                    <Chip
                                        checked={enabledRules.some(r => r.name === rule.name)}
                                        onChange={(checked) => {
                                            if (!setEnabledRules) return;
                                            if (checked) {
                                                setEnabledRules([...enabledRules, rule]);
                                            } else {
                                                setEnabledRules(enabledRules.filter(r => r.name !== rule.name));
                                            }
                                        }}
                                        disabled={!setEnabledRules && !enabledRules.some(r => r.name === rule.name)}
                                        styles={{ label: !setEnabledRules ? { cursor: "default"} : {} }}
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