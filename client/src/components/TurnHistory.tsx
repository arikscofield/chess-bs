import type {Dispatch, SetStateAction} from "react";
import {IndexToFile, PieceAscii, type Turn} from "@chess-bs/common";
import { FaStepForward, FaFastForward, FaStepBackward, FaFastBackward } from "react-icons/fa";


function TurnHistory({ turnHistory, viewMoveIndex, setViewMoveIndex }: { turnHistory: Turn[], viewMoveIndex: number, setViewMoveIndex: Dispatch<SetStateAction<number>>
}) {


    return (
        <div className={"flex flex-col justify-between h-full text-white text-base p-1"}>
            <ol className={"flex flex-col justify-between scroll-auto"}>
                {turnHistory.map((turn: Turn, idx: number) => {
                    return (<li
                    key={idx}
                    onClick={() => {
                        idx++;
                        console.log("Setting view move index to ", idx)
                        setViewMoveIndex(idx)
                    }}
                    className={`px-1 py-0.5 rounded-md transition-colors hover:cursor-pointer ${viewMoveIndex == idx+1 ? "bg-blue-500/20" : "hover:bg-blue-500/50"}`}
                    >
                        {/*{'from' in turn ? turn.piece.color + " " + turn.piece.type + " " + IndexToRank[turn.from.col] + turn.from.row + " to " + IndexToRank[turn.to.col] + turn.to.row : turn.successful}*/}
                        {/*TODO: Change away from the hard coded 7 for row/col count*/}
                        {'from' in turn
                            ? PieceAscii[turn.piece.color][turn.piece.type] + "" + IndexToFile[turn.from.col] + (7-turn.from.row+1) + " to " + IndexToFile[turn.to.col] + (7-turn.to.row+1)
                            : turn.successful ? "Successful Call" : "Failed Call"}
                    </li>)
                })}
            </ol>

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