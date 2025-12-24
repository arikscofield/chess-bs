import type {Dispatch, SetStateAction} from "react";
import {IndexToFile, PieceAscii, type Turn} from "@chess-bs/common";
import { FaStepForward, FaFastForward, FaStepBackward, FaFastBackward } from "react-icons/fa";


function TurnHistory({ turnHistory, viewMoveIndex, setViewMoveIndex }: { turnHistory: Turn[], viewMoveIndex: number, setViewMoveIndex: Dispatch<SetStateAction<number>>
}) {


    const parsedTurnHistory: ([Turn | null, number])[] = [];
    for (const [i, turn] of turnHistory.entries()) {
        parsedTurnHistory.push([turn, i]);
        if ('successful' in turn && turn.successful) {
            parsedTurnHistory.push([null, i]);
        }
    }

    const turnRows = []
    let i = 0
    while (i < parsedTurnHistory.length) {
        const row = []
        for (let j=0; j<2; j++) {
            if (i+j >= parsedTurnHistory.length) {
                row.push(<div className={"flex-1"}></div>)
                continue;
            }
            const [turn, turnViewIndex] = parsedTurnHistory[i+j];
            const content = turn === null
                ? "Skipped"
                : 'notation' in turn
                    ? turn.notation
                    : 'from' in turn
                        ? PieceAscii[turn.piece.color][turn.piece.type] + "" + IndexToFile[turn.from.col] + (7-turn.from.row+1) + " to " + IndexToFile[turn.to.col] + (7-turn.to.row+1)
                        : turn.successful ? "Successful Call" : "Failed Call"

            row.push(<div
                key={i+j}
                onClick={() => {
                    console.log("Setting view move index to ", turnViewIndex+1)
                    setViewMoveIndex(turnViewIndex+1)
                }}
                className={`px-1 py-0.5 flex-1 rounded-md transition-colors hover:cursor-pointer ${viewMoveIndex == turnViewIndex+1 ? "bg-blue-500/20" : "hover:bg-blue-500/50"}`}
            >
                {content}
            </div>)
        }
        turnRows.push(row)
        i += 2
    }

    return (
        <div className={"flex flex-col justify-between h-full text-white text-base p-1"}>
            <ol className={"flex flex-col justify-between overflow-y-auto"}>
                {turnRows.map((row, i) => (
                    <div key={i} className={"flex flex-row justify-between"}>
                        <div className={"px-1 py-0.5 text-gray-400"}>{i}</div>
                        {row[0]}
                        {row[1]}
                    </div>
                ))}
            </ol>

            {/* Button Controls*/}
            <div className={"flex flex-row justify-between"}>
                <button className={"flex justify-center grow p-1 rounded-md transition-colors hover:bg-blue-500/50 hover:cursor-pointer "}
                        onClick={() => {setViewMoveIndex(0)}}
                >
                    <FaFastBackward/>
                </button>

                <button className={"flex justify-center grow p-1 rounded-md transition-colors hover:bg-blue-500/50 hover:cursor-pointer "}
                        onClick={() => {
                            if (viewMoveIndex == -1) {
                                setViewMoveIndex(turnHistory.length - 1);
                            } else {
                                setViewMoveIndex((prev) => Math.max(0, prev-1))
                            }
                        }}
                >
                    <FaStepBackward/>
                </button>

                <button className={"flex justify-center grow p-1 rounded-md transition-colors hover:bg-blue-500/50 hover:cursor-pointer "}
                        onClick={() => {
                            if (viewMoveIndex == -1) return;
                            let newViewMoveIndex = viewMoveIndex+1
                            if (newViewMoveIndex >= turnHistory.length) newViewMoveIndex = -1
                            setViewMoveIndex(newViewMoveIndex)
                        }}
                >
                    <FaStepForward/>
                </button>

                <button className={"flex justify-center grow p-1 rounded-md transition-colors hover:bg-blue-500/50 hover:cursor-pointer "}
                        onClick={() => {setViewMoveIndex(-1)}}
                >
                    <FaFastForward/>
                </button>
            </div>
        </div>
    )
}


export default TurnHistory;