import {useEffect} from "react";
import {useSocket} from "../../components/context/SocketContext.ts";
import {type GameSpectateRequest, type GenericCallback} from "@chess-bs/common"
import {useAtomValue} from "jotai";
import {gameIdAtom} from "./atoms.ts";
import {useNavigate} from "react-router";
import {Group, Panel, Separator} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {MdOutlineDragIndicator} from "react-icons/md";
import Timer from "../../components/Timer.tsx";
import Board from "../../components/Board.tsx";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";


function Spectate() {
    const navigate = useNavigate();
    const socket = useSocket();

    const gameId = useAtomValue(gameIdAtom);


    useEffect(() => {
        if (!socket) return;

        const payload: GameSpectateRequest = {
            gameId: gameId,
        }

        socket.emit("game:spectate", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                navigate("/");
                return;
            }

        }) as GenericCallback)
    }, [socket]);


    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>

            {/* Left Side*/}
            <div className={"w-[300px] h-full"}>
                <Group className={""}
                    // style={{ height: 'calc(90vh-50px)' }}
                       orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                           "own-rules": 1
                       }}
                >
                    <Panel
                        id={"rule-pool"}
                        minSize={"250px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 "}>
                            <h3 className={"text-white text-xl font-bold text-center"}>Game Rules</h3>
                            <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Board */}
            <div className={"relative flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{"Opponent"}</div>

                    <Timer
                        timeMs={timers?.get(view === undefined ? (player?.color === Color.White ? Color.Black : Color.White) : (view === Color.White ? Color.Black : Color.White))}
                        isRunning={(view && view !== turnColor) || (view === undefined && player?.color !== turnColor)}
                    />
                </div>
                {visibleBoard !== null && player && <Board
                    board={visibleBoard}
                    gameStatus={gameStatus}
                    player={player}
                    view={view ?? player?.color}
                    turn={turnColor}
                    canMove={false}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    highlightedMove={highlightedMove}
                />
                }
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{"You"}</div>
                    <div className={"flex flex-row justify-center gap-5 py-3"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButton gameId={gameId} />
                    </div>
                    <Timer
                        timeMs={timers?.get(view === undefined ? (player?.color ?? Color.White) : view)}
                        isRunning={(view === turnColor) || (view === undefined && player?.color === turnColor)}
                    />
                </div>

            </div>

            {/* Right Side */}
            <div className={"hidden lg:block w-[300px] h-full"}>
                <Group className={""}
                    // style={{ height: 'calc(90vh-50px)' }}
                       orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2"}>
                            <TurnHistory
                                turnHistory={turnHistory}
                                viewMoveIndex={viewMoveIndex}
                                setViewMoveIndex={setViewMoveIndex}
                            />
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"chat"}
                        minSize={"100px"}
                    >
                        <Chatroom
                            gameId={gameId}
                        />
                    </Panel>
                </Group>


            </div>
        </div>
    </div>)
}


export default Spectate;