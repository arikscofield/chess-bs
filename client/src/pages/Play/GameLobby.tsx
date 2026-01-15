import {Button, CopyButton, Modal} from "@mantine/core";
import {LuClipboard, LuClipboardCheck} from "react-icons/lu";
import {BluffPunishment, CreateGameColor, type Rule} from "@chess-bs/common";
import RuleList from "../../components/RuleList.tsx";
import {useState} from "react";


function GameLobby(
    {gameId, usesTimer, timeStartMs, timeIncrementMs, bluffPunishment, creatorColor, rulePool}:
    {gameId: string, usesTimer: boolean, timeStartMs: number | undefined, timeIncrementMs: number | undefined, bluffPunishment: BluffPunishment | null, creatorColor: CreateGameColor | null, rulePool: Rule[]}
) {

    const [rulePoolModalOpen, setRulePoolModalOpen] = useState(false);

    const bluffPunishmentMap = {
        [BluffPunishment.Turn]: "Lose Turn",
        [BluffPunishment.Piece]: "Lose Piece (You Pick)",
        [BluffPunishment.PieceOpponent]: "Lose Piece (Opponent Picks)",
        [BluffPunishment.PieceRandom ]: "Lose Piece (Random)",
    }


    return (<div className={"flex flex-col justify-center items-center min-h-[calc(100vh-82px)] w-screen text-white"}>
        <div className={"flex flex-col min-w-[400px] max-w-[800px] min-h-[500px] h-[400px] rounded-xl bg-bg-2 "}>
            <p className={"text-2xl p-3 text-center"}>Game Lobby</p>

                <div className={"flex flex-row flex-1 justify-around items-center m-5 gap-3 bg-bg-2 rounded-xl"}>
                    {/* Left */}
                    <div className={"flex flex-col justify-around items-center p-3 w-full h-full text-lg bg-bg-1 rounded-xl"}>
                        {usesTimer && timeStartMs !== undefined && timeIncrementMs != undefined && <div className={""}>
                            <span className={"font-bold"}>Time: </span>
                            {timeStartMs / 1000 / 60}+{timeIncrementMs / 1000}
                        </div>}
                        <div>
                            <span className={"font-bold"}>Bluff Punishment: </span>
                            {bluffPunishmentMap[bluffPunishment ?? BluffPunishment.Turn]}
                        </div>
                        <div>
                            <span className={"font-bold"}>Color: </span>
                            {creatorColor ?? CreateGameColor.White}
                        </div>
                        <Button
                            color={"var(--color-fg-1)"}
                            onClick={() => setRulePoolModalOpen(true)}
                        >Game Rule Pool</Button>
                    </div>

                    {/* Right */}
                    <div className={"flex flex-col items-center justify-around w-full h-full px-2 py-1 bg-bg-1 rounded-xl"}>
                        <p className={"text-lg"}>Game Code: {gameId}</p>
                        <p>To invite someone, have them enter the game code, or visit the following link:</p>
                        <div className={"flex flex-row border-2 border-bg-2 rounded-md "}>
                            <p className={"text-lg m-2"}>{window.location.href}</p>
                            <CopyButton value={window.location.href}>
                                {({ copied, copy }) => (
                                    <Button
                                        color={copied ? "green" : "var(--color-fg-1)"}
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


                    <Modal
                        opened={rulePoolModalOpen}
                        onClose={() => setRulePoolModalOpen(false)}
                        title={"Possible Game Rules"}
                        classNames={{title: "text-white text-xl!", content: "bg-bg-1! ", header: "bg-bg-1!", close: "text-white! hover:bg-bg-2! hover:text-gray-400! "}}
                    >
                        <div className={"flex flex-col flex-1 bg-bg-1 rounded-xl h-full overflow-auto"}>
                            <RuleList enabledRules={rulePool} wrapChips={true} />
                        </div>
                    </Modal>
            </div>

        </div>
    </div>)
}

export default GameLobby;