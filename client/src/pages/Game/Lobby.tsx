import {Button, Card, CopyButton, Divider, Text, Title} from "@mantine/core";
import {LuClipboard, LuClipboardCheck, LuClock, LuHash, LuPalette, LuShieldAlert} from "react-icons/lu";
import {BluffPunishment} from "@chess-bs/common";
import RuleList from "../../components/RuleList.tsx";
import {useAtomValue} from "jotai"
import {
    bluffPunishmentAtom,
    clockIncrementMsAtom,
    clockStartMsAtom,
    creatorColorAtom,
    gameIdAtom, ruleCountAtom,
    rulePoolIdsAtom,
    usesClockAtom
} from "./atoms.ts";


function Lobby() {

    const gameId = useAtomValue(gameIdAtom);
    const creatorColor = useAtomValue(creatorColorAtom);
    const bluffPunishment = useAtomValue(bluffPunishmentAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const ruleCount = useAtomValue(ruleCountAtom);

    const usesClock = useAtomValue(usesClockAtom)
    const clockStartMs = useAtomValue(clockStartMsAtom);
    const clockIncrementMs = useAtomValue(clockIncrementMsAtom);

    const bluffPunishmentMap: Record<BluffPunishment, string> = {
        [BluffPunishment.Turn]: "Lose Turn",
        [BluffPunishment.Piece]: "Lose Piece (You Pick)",
        [BluffPunishment.PieceOpponent]: "Lose Piece (Opponent Picks)",
        [BluffPunishment.PieceRandom ]: "Lose Piece (Random)",
    }

    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white"}>
        <div className={"w-full max-w-2xl"}>
            {/* Header */}
            <div className={"text-center mb-4"}>
                <Title order={2}>Game Lobby</Title>
                <Text size={"sm"} c={"gray"}>Share the game code or link with your opponent</Text>
            </div>

            {/* Game Code/Link */}
            <Card className={"bg-bg-2! mb-3"}>
                <div className={"flex flex-col items-center gap-3 text-white"}>
                    <div className={"flex flex-row justify-center items-center gap-5"}>
                        <Text>
                            Game Code:{" "}
                            <Text span inherit c={"var(--color-fg-1)"} fw={700}>{gameId}</Text>
                        </Text>
                        <CopyButton value={window.location.href}>
                            {({ copied, copy }) => (
                                <Button
                                    color={copied ? "green" : "var(--color-fg-1)"}
                                    onClick={() => {
                                        copy();
                                    }}
                                    classNames={{root: "transition-colors duration-300"}}
                                >
                                    {copied
                                        ? <><LuClipboardCheck size={25} className={"mr-1"}/>Copy Link</>
                                        : <><LuClipboard size={25} className={"mr-1"}/>Copy Link</>}
                                </Button>
                            )}
                        </CopyButton>
                    </div>

                    <Text size="sm" className="text-gray-500 text-center">
                        or visit: <span className="font-mono text-gray-400">{window.location.href}</span>
                    </Text>
                </div>
            </Card>

            {/* Game Settings/Info */}
            <Card className={"bg-bg-2! mb-3"}>
                <Title order={3} className={"text-white text-center"} mb={8}>Game Settings</Title>

                <div className={"flex flex-col items-center gap-3 text-white"}>

                    {/* Time Control */}
                    {usesClock && clockStartMs !== undefined && clockIncrementMs !== undefined && (
                        <div className={"flex flex-row items-center justify-between w-full"}>
                            <div className={"flex flex-row justify-center items-center gap-2"}>
                                <LuClock color={"var(--color-fg-1)"}/>
                                <Text>Time Control</Text>
                            </div>
                            <Text>
                                {clockStartMs / 1000 / 60}min + {clockIncrementMs / 1000}sec
                            </Text>
                        </div>
                    )}

                    <Divider color={"var(--color-fg-1)"} my={1} className={"w-full opacity-50"}/>

                    {/* Bluff Punishment */}
                    <div className={"flex flex-row items-center justify-between w-full"}>
                        <div className={"flex flex-row justify-center items-center gap-2"}>
                            <LuShieldAlert color={"var(--color-fg-1)"}/>
                            <Text>Bluff Punishment</Text>
                        </div>
                        <Text>
                            {bluffPunishmentMap[bluffPunishment ?? BluffPunishment.Turn]}
                        </Text>
                    </div>

                    <Divider color={"var(--color-fg-1)"} my={1} className={"w-full opacity-50"}/>

                    {/* Creator Color */}
                    <div className={"flex flex-row items-center justify-between w-full"}>
                        <div className={"flex flex-row justify-center items-center gap-2"}>
                            <LuPalette color={"var(--color-fg-1)"}/>
                            <Text>Creator Color</Text>
                        </div>
                        <Text>
                            {creatorColor}
                        </Text>
                    </div>

                    <Divider color={"var(--color-fg-1)"} my={1} className={"w-full opacity-50"}/>

                    {/* Rule Count */}
                    <div className={"flex flex-row items-center justify-between w-full"}>
                        <div className={"flex flex-row justify-center items-center gap-2"}>
                            <LuHash color={"var(--color-fg-1)"}/>
                            <Text>Rule Count</Text>
                        </div>
                        <Text>
                            {ruleCount}
                        </Text>
                    </div>

                </div>
            </Card>

            {/* Rule Pool/Count */}
            <Card className={"bg-bg-2!"}>
                <Title order={3} className={"text-white text-center"} mb={8}>Rule Pool</Title>

                <RuleList enabledRuleIds={rulePoolIds} size={"xs"}/>
            </Card>

        </div>
    </div>)
}

export default Lobby;