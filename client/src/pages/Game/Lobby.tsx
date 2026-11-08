import {Button, CopyButton, Loader, TextInput, Tooltip} from "@mantine/core";
import {
    LuCheck,
    LuCopy,
    LuLayers,
    LuLink,
} from "react-icons/lu";
import RuleList from "../../components/RuleList.tsx";
import {useAtomValue} from "jotai"
import {
    gameIdAtom, playersAtom,
    rulePoolIdsAtom,
} from "./atoms.ts";
import {useAuth} from "../../components/context/AuthContext.ts";
import GameSettingsSummary from "../../components/GameSettingsSummary.tsx";
import GamePanel from "../../components/GamePanel.tsx";


function Lobby() {
    const gameId = useAtomValue(gameIdAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const players = useAtomValue(playersAtom);

    const {user} = useAuth();

    const yourColor = players.find(p => p.userId === user?.userId)?.color;
    const gameUrl = window.location.href;

    return (<div className={"flex flex-col items-center w-full px-1 py-6 sm:py-12"}>
        <div className={"w-full max-w-2xl flex flex-col gap-4"}>

            {/* Header */}
            <div className={"flex flex-col items-center text-center gap-3 mb-2"}>
                <div className={"flex items-center justify-center w-14 h-14 rounded-full bg-fg-1/10"}>
                    <Loader type={"dots"} size={"sm"}/>
                </div>
                <div>
                    <h1 className={"text-2xl sm:text-3xl font-bold text-fg-2"}>Waiting for an opponent</h1>
                    <p className={"text-fg-3 mt-1"}>Send them the link below. The game starts as soon as they join.</p>
                </div>
            </div>

            {/* Invite */}
            <div className={"rounded-xl bg-bg-2/70 border border-white/5 p-4 flex flex-col gap-3"}>

                {/* Link + copy button*/}
                <div className={"flex flex-row gap-2"}>
                    <TextInput
                        flex={1}
                        readOnly
                        value={gameUrl}
                        aria-label={"Game link"}
                        leftSection={<LuLink size={15}/>}
                        onFocus={e => e.currentTarget.select()}
                        classNames={{input: "font-mono text-sm"}}
                    />
                    <CopyButton value={gameUrl}>
                        {({copied, copy}) => (
                            <Button
                                onClick={copy}
                                color={copied ? "green" : undefined}
                                leftSection={copied ? <LuCheck size={16}/> : <LuCopy size={16}/>}
                                className={"min-w-30 transition-colors"}
                            >
                                {copied ? "Copied" : "Copy link"}
                            </Button>
                        )}
                    </CopyButton>
                </div>

                {/* Pure game code*/}
                <div className={"flex flex-row items-center justify-center gap-2 text-sm text-fg-3"}>
                    or share the code
                    <CopyButton value={gameId}>
                        {({copied, copy}) => (
                            <Tooltip label={copied ? "Copied" : "Copy code"}>
                                <button
                                    type={"button"}
                                    onClick={copy}
                                    className={"font-mono font-bold text-base tracking-wider text-fg-1 bg-fg-1/10 hover:bg-fg-1/20 rounded-md px-2.5 py-0.5 transition-colors cursor-pointer"}
                                >
                                    {gameId}
                                </button>
                            </Tooltip>
                        )}
                    </CopyButton>
                </div>
            </div>

            {/* Settings */}
            <GameSettingsSummary yourColor={yourColor}/>

            {/* Rule Pool */}
            <GamePanel title={"Rule pool"} icon={<LuLayers size={14}/>} className={"h-auto"}>
                <RuleList enabledRuleIds={rulePoolIds} size={"xs"} wrapChips={true}/>
            </GamePanel>
        </div>
    </div>)
}

export default Lobby;