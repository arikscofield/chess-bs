

import {allRules, Color, PieceType, type Rule} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import {Chip, Tooltip} from "@mantine/core";

function RuleList({ enabledRules, setEnabledRules, color = Color.White }: { enabledRules: Rule[], setEnabledRules: (enabledRules: Rule[]) => void, color?: Color }) {

    return (<div className={"@container "}>
        <div className={"grid divide-x-2 divide-gray-300"} style={{ gridTemplateColumns: `repeat(${Object.values(PieceType).length},1fr)` }}>
            {Object.values(PieceType).map((pieceType) => {
                const pieceString: string = "" + color + pieceType;

                return <div key={pieceType} className={"flex flex-col flex-1 w-full items-center px-2"}>
                    <img src={pieceImages[pieceString]} alt={pieceString} />
                    {allRules.filter((rule: Rule) => rule.pieceType === pieceType).map((rule: Rule) => (
                        <div key={rule.name} className={"flex flex-row"}>
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
                                            if (checked) {
                                                setEnabledRules([...enabledRules, rule]);
                                            } else {
                                                setEnabledRules(enabledRules.filter(r => r.name !== rule.name));
                                            }
                                        }}
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