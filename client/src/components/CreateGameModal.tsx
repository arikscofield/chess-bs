import {Button, Center, Group, Modal, NumberInput, Radio, SegmentedControl, Slider, Switch, Text} from "@mantine/core";
import {useState} from "react";
import {allRules, BluffPunishment, CreateGameColor} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import RuleList from "./RuleList.tsx";


const CLOCK_START_VALUES = [
    0, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];
const CLOCK_INCREMENT_VALUES = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];

function CreateGameModal({opened, onClose, onSubmit}: {
    opened: boolean,
    onClose: () => void,
    onSubmit: (color: CreateGameColor, clockStartSeconds: number | null, clockIncrementSeconds: number | null, bluffPunishment: BluffPunishment, ruleCount: number, rulePoolIds: number[]) => void
}) {
    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment>(BluffPunishment.Turn);


    const [ruleCount, setRuleCount] = useState<number | string>(3);
    const [rulePoolModalOpen, setRulePoolModalOpen] = useState<boolean>(false);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>(allRules.map(rule => rule.id));

    const [clockEnabled, setClockEnabled] = useState<boolean>(false);
    const [clockStartMinutes, setClockStartMinutes] = useState<number>(5);
    const [clockStartIndex, setClockStartIndex] = useState(CLOCK_START_VALUES.indexOf(clockStartMinutes));
    const [clockIncrementSeconds, setClockIncrementSeconds] = useState<number>(3)
    const [clockIncrementIndex, setClockIncrementIndex] = useState(CLOCK_INCREMENT_VALUES.indexOf(clockIncrementSeconds));

    const [color, setColor] = useState<CreateGameColor>(CreateGameColor.White);


    if (rulePoolModalOpen) {
        return <Modal
            opened={rulePoolModalOpen}
            onClose={() => setRulePoolModalOpen(false)}
            title={"Rule Pool"}
            centered
            size={"75%"}
            styles={{ title: {fontSize: "2em"}}}
        >
            <RuleList enabledRuleIds={rulePoolIds} setEnabledRuleIds={setRulePoolIds} wrapChips={true}/>
            <div className={"flex flex-row justify-center mt-10"}>
                <Button color={""}
                        onClick={() => setRulePoolModalOpen(false)}
                >
                    Back
                </Button>
            </div>
        </Modal>
    }


    return (<Modal
        opened={opened}
        onClose={onClose}
        size={"auto"}
        title={"Create Game"}
        centered
        classNames={{body: "flex flex-col justify-center items-center "}}
        styles={{ title: {fontSize: "2em"}}}
    >

        {/* Enable/Disable Time control switch */}
        <div className={`${clockEnabled ? "" : "mb-5"}`}>
            <Switch
                checked={clockEnabled}
                onChange={(event) => setClockEnabled(event.target.checked)}
                label={"Time Control"}
                size={"md"}
                className={""}
            />
        </div>


        {/* Starting time and Increment sliders */}
        {clockEnabled && <div className={"w-full mb-5"}>
            <Text size={"md"}>Minutes per side: {clockStartMinutes}</Text>
            <Slider value={clockStartIndex} onChange={(index) => {
                setClockStartIndex(index)
                setClockStartMinutes(CLOCK_START_VALUES[index])
            }}
                    label={clockStartMinutes}
                    min={0}
                    max={CLOCK_START_VALUES.length - 1}
                    step={1}
                    size={"lg"}
                    restrictToMarks
                    marks={CLOCK_START_VALUES.map((_, index) => ({
                        value: index,
                    }))}
                    styles={{
                        mark: { display: 'none' },
                        root: { backgroundColor: clockStartMinutes === 0 && clockIncrementSeconds === 0 ? "rgba(255,0,0,0.22)" : ""},
                    }}

            />

            <div>Increment in seconds: {clockIncrementSeconds}</div>
            <Slider value={clockIncrementIndex} onChange={(index) => {
                setClockIncrementIndex(index)
                setClockIncrementSeconds(CLOCK_INCREMENT_VALUES[index])
            }}
                    label={CLOCK_INCREMENT_VALUES[clockIncrementIndex]}
                    min={0}
                    max={CLOCK_INCREMENT_VALUES.length - 1}
                    step={1}
                    size={"lg"}
                    restrictToMarks
                    marks={CLOCK_INCREMENT_VALUES.map((_, index) => ({
                        value: index,
                    }))}
                    styles={{ mark: { display: 'none' }, root: { backgroundColor: clockStartMinutes === 0 && clockIncrementSeconds === 0 ? "rgba(255,0,0,0.22)" : ""} }}
            />
        </div>}


        {/* Rule Count and Rule Pool selection */}
        <div className={"flex flex-row justify-around items-center w-full pb-5"}>
            <NumberInput
                value={ruleCount}
                onChange={setRuleCount}
                label={"Rule Count"}
                description={"The number of rules each player gets"}
                size={"md"}
                allowDecimal={false}
                allowNegative={false}
                min={0}
                max={rulePoolIds.length}
                required
                error={typeof ruleCount === "string"
                    ? "Invalid Rule Count"
                    : ruleCount > rulePoolIds.length
                        ? "Rule Count greater than number of enabled rules"
                        : ""
                }
            />

            <Button
                color={"blue"}
                size={"md"}
                onClick={() => setRulePoolModalOpen(true)}
            >
                Rule Pool
            </Button>

            <Modal opened={rulePoolModalOpen} onClose={() => setRulePoolModalOpen(false)}/>
        </div>


        {/* Called Bluff Punishment selection */}
        <Radio.Group
            value={bluffPunishment}
            onChange={(val) => {setBluffPunishment(val as BluffPunishment);}}
            name={"blushPunishment"}
            label={"Called Bluff Punishment"}
            description={"The punishment for getting called out for bluffing, or incorrectly calling a bluff"}
            withAsterisk
            size={"md"}
            className={"px-1 pb-5"}
        >
            <Group>
                <Radio value={BluffPunishment.Turn} label={"Lose Turn"} className={"pt-2"}/>
                <Radio value={BluffPunishment.Piece} label={"Lose Piece (You Pick)"} className={"pt-2"}/>
                <Radio value={BluffPunishment.PieceOpponent} label={"Lose Piece (Opponent Picks)"} className={"pt-2"}/>
                <Radio value={BluffPunishment.PieceRandom} label={"Lose Piece (Random)"} className={"pt-2"}/>
            </Group>
        </Radio.Group>


        {/* Color Selection */}
        <div className={"flex flex-row items-center pb-5"}>
            <p className={"px-3 text-base"}>Your Color</p>
            <SegmentedControl
                value={color}
                onChange={(val) => {setColor(val as CreateGameColor);}}
                size={"md"}
                data={[
                    { value: CreateGameColor.White, label: <Center><img src={pieceImages["WhiteKing"]} alt={"White"} width={30} /><span>White</span></Center> },
                    { value: CreateGameColor.Black, label: <Center><img src={pieceImages["BlackKing"]} alt={"Black"} width={30} /><span>Black</span></Center> },
                    { value: CreateGameColor.Random, label: <Center className={"px-4 py-0.5 h-full"}><img src={pieceImages["RandomKing"]} alt={"Random"} width={25} className={"pr-1 py-0.5"}/><span>Random</span></Center> },
                ]}
                // className={"py-2"}
            />
        </div>


        {/* Action buttons */}
        <Group justify={"space-around"} className={"w-full"}>
            <Button color={"red"} onClick={onClose} size={"md"}>
                Cancel
            </Button>

            <Button color={"green"} size={"md"}
                    onClick={() => {
                        onSubmit(color, clockEnabled ? clockStartMinutes * 60 : null, clockEnabled ? clockIncrementSeconds : null, bluffPunishment, typeof ruleCount === "number" ? ruleCount : 3, rulePoolIds);
                    }}
                    disabled={
                        (clockStartMinutes === 0 && clockIncrementSeconds === 0) ||
                        (typeof ruleCount === "string" || ruleCount > rulePoolIds.length)
                    }
            >
                Create
            </Button>
        </Group>


    </Modal>)
}


export default CreateGameModal;