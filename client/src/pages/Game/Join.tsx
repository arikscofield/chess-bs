import {Button, Loader} from "@mantine/core";
import {useAtomValue} from "jotai";
import {gameIdAtom, playersAtom, rulePoolIdsAtom} from "./atoms.ts";
import {useSocket} from "../../components/context/SocketContext.ts";
import {useAuth} from "../../components/context/AuthContext.ts";
import {Color} from "@chess-bs/common";
import {useState} from "react";
import RuleList from "../../components/RuleList.tsx";
import GameSettingsSummary from "../../components/GameSettingsSummary.tsx";
import GamePanel from "../../components/GamePanel.tsx";
import {LuLayers} from "react-icons/lu";


function Join({handleJoinGame}: {handleJoinGame: (gameId: string) => void}) {

    const gameId = useAtomValue(gameIdAtom);
    const players = useAtomValue(playersAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);

    const socket = useSocket();
    const { isConnected } = useAuth();
    const [joining, setJoining] = useState(false);

    const host = players[0];
    const yourColor = host ? (host.color === Color.White ? Color.Black : Color.White) : undefined;

    if (!isConnected || !socket) {
        return <div className="flex flex-col justify-center items-center gap-3 min-h-[60vh] w-full text-fg-3">
            <Loader/>
            Connecting to server…
        </div>
    }


    return (<div className={"flex flex-col items-center w-full px-1 py-6 sm:py-12"}>
        <div className={"w-full max-w-xl flex flex-col gap-4"}>
            <div className={"text-center"}>
                <p className={"text-sm font-medium text-fg-1 mb-1"}>You've been invited</p>
                <h1 className={"text-2xl sm:text-3xl font-bold text-fg-2"}>
                    {host ? <>Play against <span className={"text-fg-1"}>{host.username}</span></> : "Join this game"}
                </h1>
                <p className={"text-fg-3 mt-1"}>Game code <span className={"font-mono font-semibold text-fg-2"}>{gameId}</span></p>
            </div>

            <GameSettingsSummary yourColor={yourColor}/>

            <GamePanel title={"Rule pool"} icon={<LuLayers size={14}/>} className={"h-auto"}>
                <RuleList enabledRuleIds={rulePoolIds} size={"xs"} onlyShowEnabled={true} wrapChips={true}/>
            </GamePanel>

            <Button
                size={"lg"}
                fullWidth
                loading={joining}
                onClick={() => {
                    setJoining(true);
                    handleJoinGame(gameId);
                }}
            >
                Join game
            </Button>
        </div>
    </div>)
}


export default Join;