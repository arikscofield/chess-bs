import {
    Button,
    Center,
    CheckIcon,
    Group,
    Modal,
    NumberInput,
    Radio,
    SegmentedControl,
    Select,
    Text,
} from "@mantine/core";
import {type ReactNode, useState} from "react";
import {allRules, BluffPunishment, BotDifficulty, CreateGameColor} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import RuleList from "./RuleList.tsx";
import {useMediaQuery} from "@mantine/hooks";

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
        botDifficulty: BotDifficulty,
    ) => Promise<boolean>,
    error?: string,
}) {
    const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment>(BluffPunishment.Turn);
    const [ruleCount, setRuleCount] = useState<number | string>(3);
    const [rulePoolModalOpen, setRulePoolModalOpen] = useState<boolean>(false);
    const [rulePoolIds, setRulePoolIds] = useState<number[]>(allRules.map(rule => rule.id));
    const [color, setColor] = useState<CreateGameColor>(CreateGameColor.White);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(BotDifficulty.Medium);

    const [creatingGame, setCreatingGame] = useState<boolean>(false);


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
        title={"Create Bot Game"}
        centered
        classNames={{body: "flex flex-col gap-4 justify-center items-center ", title: "text-fg-2"}}
        styles={{ title: {fontSize: "2em"}}}
    >

        {/* Rule Count and Rule Pool selection */}
        <NumberInput
            value={ruleCount}
            onChange={setRuleCount}
            label={<Text span>Rule Count</Text>}
            size={"sm"}
            w={200}
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

        {/* Bot Difficulty selection */}
        <Radio.Group
            value={botDifficulty}
            onChange={(val) => {setBotDifficulty(val as BotDifficulty);}}
            name={"botDifficulty"}
            label={<Text>Bot Difficulty</Text>}
            size={"md"}
            className={"hidden lg:block"}
        >
            <Group mt={"xs"}>
                <Radio value={BotDifficulty.Easy} label={<Text>Easy</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Medium} label={<Text>Medium</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Hard} label={<Text>Hard</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Random} label={<Text>Random</Text>} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
            </Group>
        </Radio.Group>
        <Select
            value={botDifficulty}
            label={<Text>Bot Difficulty</Text>}
            w={200}
            onChange={(value) => {setBotDifficulty(value as BotDifficulty);}}
            data={[
                { label: "Easy", value: BotDifficulty.Easy },
                { label: "Medium", value: BotDifficulty.Medium },
                { label: "Hard", value: BotDifficulty.Hard },
                { label: "Random", value: BotDifficulty.Random },

            ]}
            classNames={{
                root: "lg:hidden"
            }}
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
                        setCreatingGame(true);
                        onSubmit(
                            color,
                            bluffPunishment,
                            typeof ruleCount === "number" ? ruleCount : 3,
                            rulePoolIds,
                            botDifficulty,
                        ).then((success) => {
                            if (!success) setCreatingGame(false);
                        });
                    }}
                    disabled={
                        (typeof ruleCount === "string" || ruleCount > rulePoolIds.length)
                    }
                    loading={creatingGame}
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