import {Button, Center, Group, Modal, NumberInput, Radio, SegmentedControl, Select} from "@mantine/core";
import {useState} from "react";
import {allRules, BluffPunishment, BotDifficulty, CreateGameColor} from "@chess-bs/common";

import {pieceImages} from "../assets/pieceImages.ts";
import RuleList from "./RuleList.tsx";


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
        title={"Create Bot Game"}
        centered
        classNames={{body: "flex flex-col gap-4 justify-center items-center "}}
        styles={{ title: {fontSize: "2em"}}}
    >





        {/* Rule Count and Rule Pool selection */}
        <div className={"flex flex-row justify-around items-center w-full"}>
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
                color={"var(--color-fg-1)"}
                size={"md"}
                onClick={() => setRulePoolModalOpen(true)}
            >
                Rule Pool
            </Button>

            <Modal opened={rulePoolModalOpen} onClose={() => setRulePoolModalOpen(false)}/>
        </div>

        {/* Bot Difficulty selection */}
        <Radio.Group
            value={botDifficulty}
            onChange={(val) => {setBotDifficulty(val as BotDifficulty);}}
            name={"botDifficulty"}
            label={"Bot Difficulty"}
            size={"md"}
        >
            <Group mt={"xs"}>
                <Radio value={BotDifficulty.Easy} label={"Easy"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Medium} label={"Medium"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Hard} label={"Hard"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BotDifficulty.Random} label={"Random"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
            </Group>
        </Radio.Group>
        <Select
            value={botDifficulty}
            label={"Bot Difficulty"}
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
            label={"Called Bluff Punishment"}
            // description={"The punishment for getting called out for bluffing, or incorrectly calling a bluff"}
            size={"md"}
            className={"hidden lg:block "}
        >
            <Group mt={"xs"}>
                <Radio value={BluffPunishment.Turn} label={"Lose Turn"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BluffPunishment.Piece} label={"Lose Piece (You Pick)"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BluffPunishment.PieceOpponent} label={"Lose Piece (Opponent Picks)"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
                <Radio value={BluffPunishment.PieceRandom} label={"Lose Piece (Random)"} color={"var(--color-fg-1)"} classNames={{body: "items-center"}}/>
            </Group>
        </Radio.Group>

        <Select
            value={bluffPunishment}
            label={"Bluff Punishment"}
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
            />
        </div>


        {/* Action buttons */}
        <Group justify={"space-around"} className={"w-full"}>
            <Button color={"red"} onClick={onClose} size={"md"}>
                Cancel
            </Button>

            <Button color={"green"} size={"md"}
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