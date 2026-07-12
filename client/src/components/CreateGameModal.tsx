import {
    Button,
    Center, CheckIcon,
    Group,
    Modal,
    NumberInput,
    Radio,
    SegmentedControl,
    Select,
    Slider,
    Switch,
    Text,
} from "@mantine/core";
import {type ReactNode, useState} from "react";
import {allRules, BluffPunishment, CreateGameColor, GameVisibility} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import RuleList from "./RuleList.tsx";
import {useMediaQuery} from "@mantine/hooks";


const CLOCK_START_VALUES = [
    0, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];
const CLOCK_INCREMENT_VALUES = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 25, 30, 35, 40, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
];

const createGameColorIcons: Record<CreateGameColor, ReactNode> = {
    [CreateGameColor.White]: <img src={pieceImages["WhiteKing"]} alt={"White"} width={30}></img>,
    [CreateGameColor.Black]: <img src={pieceImages["BlackKing"]} alt={"Black"} width={30}></img>,
    [CreateGameColor.Random]: <img src={pieceImages["RandomKing"]} alt={"Random"} width={25} className={""}></img>,
}

function CreateGameModal({opened, onClose, onSubmit, error}: {
    opened: boolean,
    onClose: () => void,
    onSubmit: (
        color: CreateGameColor,
        bluffPunishment: BluffPunishment,
        ruleCount: number,
        rulePoolIds: number[],
        gameVisibility: GameVisibility,
        usesClock: boolean,
        clockStartSeconds?: number,
        clockIncrementSeconds?: number,
    ) => void,
    error?: string,
}) {
    const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment>(BluffPunishment.Turn);

    const [ruleCount, setRuleCount] = useState<number | string>(3);
    const [rulePoolModalOpen, setRulePoolModalOpen] = useState<boolean>(false);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>(allRules.map(rule => rule.id));

    const [gameVisibility, setGameVisibility] = useState<GameVisibility>(GameVisibility.Private);

    const [clockEnabled, setClockEnabled] = useState<boolean>(false);
    const [clockStartMinutes, setClockStartMinutes] = useState<number>(5);
    const [clockStartIndex, setClockStartIndex] = useState(CLOCK_START_VALUES.indexOf(clockStartMinutes));
    const [clockIncrementSeconds, setClockIncrementSeconds] = useState<number>(3);
    const [clockIncrementIndex, setClockIncrementIndex] = useState(CLOCK_INCREMENT_VALUES.indexOf(clockIncrementSeconds));

    const [color, setColor] = useState<CreateGameColor>(CreateGameColor.White);


    if (rulePoolModalOpen) {
        return <Modal
            opened={rulePoolModalOpen}
            onClose={() => setRulePoolModalOpen(false)}
            title={"Rule Pool"}
            centered
            size={isMobile ? "xl": "md"}
            styles={{ title: {fontSize: "2em", color: "var(--color-fg-2)"} }}
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
        classNames={{body: "flex flex-col justify-center items-center gap-4", content: "border-2! border-white/20", title: "text-fg-2"}}
        styles={{ title: {fontSize: "2em"}}}
    >

        <Switch
            checked={gameVisibility === GameVisibility.Public}
            onChange={(event) => {
                if (event.target.checked) {
                    setGameVisibility(GameVisibility.Public);
                } else {
                    setGameVisibility(GameVisibility.Private);
                }
            }}
            label={<Text>Public Game</Text>}
            size={"md"}
            color={"var(--color-fg-1"}
        />

        {/* Time Control*/}
        <div className={`grid grid-cols-[1fr_2fr] gap-2 items-center w-full justify-items-center`}>
            <Switch
                checked={clockEnabled}
                onChange={(event) => setClockEnabled(event.target.checked)}
                label={<Text>Time Control</Text>}
                size={"md"}
                color={"var(--color-fg-1)"}
                className={""}
            />

            <div className={`w-full ${!clockEnabled && 'opacity-50' }`}>
                <Text size={"md"}>Minutes per side: {clockStartMinutes}</Text>
                <Slider value={clockStartIndex}
                    color={"var(--color-fg-1)"}
                    label={clockStartMinutes}
                    min={0}
                    max={CLOCK_START_VALUES.length - 1}
                    step={1}
                    size={"lg"}
                    restrictToMarks
                    disabled={!clockEnabled}
                    marks={CLOCK_START_VALUES.map((_, index) => ({
                        value: index,
                    }))}
                    onChange={(index) => {
                        setClockStartIndex(index)
                        setClockStartMinutes(CLOCK_START_VALUES[index])
                    }}
                    styles={{
                        mark: { display: 'none' },
                        root: { backgroundColor: clockStartMinutes === 0 && clockIncrementSeconds === 0 ? "rgba(255,0,0,0.22)" : ""},
                    }}

                />

                <Text size={"md"}>Increment in seconds: {clockIncrementSeconds}</Text>
                <Slider value={clockIncrementIndex}
                        color={"var(--color-fg-1)"}
                        label={CLOCK_INCREMENT_VALUES[clockIncrementIndex]}
                        min={0}
                        max={CLOCK_INCREMENT_VALUES.length - 1}
                        step={1}
                        size={"lg"}
                        restrictToMarks
                        disabled={!clockEnabled}
                        marks={CLOCK_INCREMENT_VALUES.map((_, index) => ({
                            value: index,
                        }))}
                        onChange={(index) => {
                            setClockIncrementIndex(index)
                            setClockIncrementSeconds(CLOCK_INCREMENT_VALUES[index])
                        }}
                        styles={{ mark: { display: 'none' }, root: { backgroundColor: clockStartMinutes === 0 && clockIncrementSeconds === 0 ? "rgba(255,0,0,0.22)" : ""} }}
                />
            </div>
        </div>

        {/* Rule Count and Rule Pool selection */}
        <NumberInput
            value={ruleCount}
            onChange={setRuleCount}
            label={<Text>Rule Count</Text>}
            size={"sm"}
            w={200}
            allowDecimal={false}
            allowNegative={false}
            min={0}
            max={rulePoolIds.length}
            error={typeof ruleCount === "string"
                ? "Invalid Rule Count"
                : ruleCount > rulePoolIds.length
                    ? "Rule Count greater than number of enabled rules"
                    : ""
            }
        />


        {/* Called Bluff Punishment selection */}
        <Radio.Group
            value={bluffPunishment}
            onChange={(val) => {setBluffPunishment(val as BluffPunishment);}}
            name={"blushPunishment"}
            label={<Text>Bluff Punishment</Text>}
            size={"md"}
            className={"hidden lg:block "}
        >
            <Group mt={"xs"}>
                <Radio value={BluffPunishment.Turn} label={<Text>Lose Turn</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                {/* TODO: un-disable other bluff punishments once working */}
                <Radio value={BluffPunishment.Piece} label={<Text>Lose Piece (You Pick)</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}} disabled={true}/>
                <Radio value={BluffPunishment.PieceOpponent} label={<Text>Lose Piece (Opponent Picks)</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}} disabled={true}/>
                <Radio value={BluffPunishment.PieceRandom} label={<Text>Lose Piece (Random)</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}} disabled={true}/>
            </Group>
        </Radio.Group>

        <Select
            value={bluffPunishment}
            label={<Text>Bluff Punishment</Text>}
            allowDeselect={false}
            w={200}
            onChange={(value) => {setBluffPunishment(value as BluffPunishment);}}
            data={[
                { label: "Lose Turn", value: BluffPunishment.Turn},
                { label: "Lose Piece (You Pick)", value: BluffPunishment.Piece},
                { label: "Lose Piece (Opponent Picks)", value: BluffPunishment.PieceOpponent},
                { label: "Lose Piece (Random)", value: BluffPunishment.PieceRandom},

            ]}
            classNames={{
                root: "lg:hidden"
            }}
        />


        {/* Desktop Color Selection */}
        <div className={"hidden md:flex flex-row items-center pb-5"}>
            <Text px={8}>Your Color</Text>
            <SegmentedControl
                value={color}
                color={"var(--color-fg-1)"}
                onChange={(value) => {setColor(value as CreateGameColor);}}
                size={"md"}
                autoContrast={true}
                data={[
                    { value: CreateGameColor.White, label: <Center><img src={pieceImages["WhiteKing"]} alt={"White"} width={30} /><span>White</span></Center> },
                    { value: CreateGameColor.Black, label: <Center><img src={pieceImages["BlackKing"]} alt={"Black"} width={30} /><span>Black</span></Center> },
                    { value: CreateGameColor.Random, label: <Center className={"px-4 py-0.5 h-full"}><img src={pieceImages["RandomKing"]} alt={"Random"} width={25} className={"pr-1 py-0.5"}/><span>Random</span></Center> },
                ]}
                classNames={{ indicator: "rounded-lg!" }}
            />
        </div>
        {/* Mobile Color Selection */}
        <Select
            value={color}
            label={<Text>Your Color</Text>}
            w={200}
            allowDeselect={false}
            leftSection={createGameColorIcons[color]}
            leftSectionPointerEvents={"none"}
            onChange={(value) => {setColor(value as CreateGameColor);}}
            data={[
                { value: CreateGameColor.White, label: "White" },
                { value: CreateGameColor.Black, label: "Black" },
                { value: CreateGameColor.Random, label: "Random" },
            ]}
            renderOption={({ option, checked }) => (
                <Group flex={"1"} gap={"xs"}>
                    {createGameColorIcons[option.value as CreateGameColor]}
                    {option.label}
                    {checked && <CheckIcon size={10} opacity={0.6} style={{ marginInlineStart: "auto"}}/>}
                </Group>
            )}
            classNames={{ root: "md:hidden" }}
        />


        {/* Action buttons */}
        <Group justify={"space-around"} className={"w-full"}>
            <Button color={"red"} onClick={onClose} size={isMobile ? "sm" : "md"}>
                Cancel
            </Button>

            <Button
                color={"var(--color-fg-1)"}
                size={isMobile ? "sm" : "md"}
                onClick={() => setRulePoolModalOpen(true)}
            >
                Rule Pool
            </Button>
            <Modal opened={rulePoolModalOpen} onClose={() => setRulePoolModalOpen(false)}/>

            <Button color={"green"} size={isMobile ? "sm" : "md"}
                    onClick={() => {
                        onSubmit(
                            color,
                            bluffPunishment,
                            typeof ruleCount === "number" ? ruleCount : 3,
                            rulePoolIds,
                            gameVisibility,
                            clockEnabled,
                            clockEnabled ? clockStartMinutes * 60 : undefined,
                            clockEnabled ? clockIncrementSeconds : undefined,
                        );
                    }}
                    disabled={
                        (clockStartMinutes === 0 && clockIncrementSeconds === 0) ||
                        (typeof ruleCount === "string" || ruleCount > rulePoolIds.length)
                    }
            >
                Create
            </Button>
        </Group>

        {error && <p className={"text-red-600 font-bold"}>
            {error}
        </p>}

    </Modal>)
}


export default CreateGameModal;