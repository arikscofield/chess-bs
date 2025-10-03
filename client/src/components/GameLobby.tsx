import {Button, CopyButton} from "@mantine/core";
import {LuClipboard, LuClipboardCheck} from "react-icons/lu";
import {BluffPunishment, CreateGameColor, type Rule} from "@chess-bs/common";
import RuleList from "./RuleList.tsx";


function GameLobby(
    {gameId, usesTimer, timeStartMs, timeIncrementMs, bluffPunishment, creatorColor, rulePool}:
    {gameId: string, usesTimer: boolean, timeStartMs: number | null, timeIncrementMs: number | null, bluffPunishment: BluffPunishment | null, creatorColor: CreateGameColor | null, rulePool: Rule[]}
) {


    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white"}>
        <div className={"flex flex-col w-3/4 min-h-[500px] h-[70%] rounded-xl bg-bg-2 "}>
            <p className={"text-2xl p-5 text-center"}>Game Lobby</p>
            <div className={"flex flex-row w-full grow"}>
                <div className={"flex flex-col flex-1 justify-around items-center m-10 p-4 bg-bg-1 rounded-xl"}>
                    <p className={"text-lg"}>Game Code: {gameId}</p>
                    <p>To invite someone, have them enter the game code, or visit the following link:</p>
                    <div className={"flex flex-row border-2 border-bg-2 rounded-md"}>
                        <p className={"text-lg m-2"}>{window.location.href}</p>
                        <CopyButton value={window.location.href}>
                            {({ copied, copy }) => (
                                <Button
                                    color={copied ? "teal" : "blue"}
                                    onClick={() => {
                                        copy();
                                    }}
                                    classNames={{root: "transition-colors duration-300"}}
                                    styles={{root: { height: "100%" }}}
                                >
                                    {copied
                                        ? <LuClipboardCheck size={25}/>
                                        : <LuClipboard size={25}/>}
                                </Button>
                            )}
                        </CopyButton>
                    </div>
                </div>
                <div className={"flex flex-col flex-[1.5] m-10 bg-bg-1 rounded-xl max-h-full overflow-auto"}>
                    <div className={""}>
                        <RuleList enabledRules={rulePool} />
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default GameLobby;