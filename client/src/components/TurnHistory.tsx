import {type Dispatch, type SetStateAction, useEffect} from "react";
import {Color, IndexToFile, PieceAscii, type Turn} from "@chess-bs/common";
import { FaStepForward, FaFastForward, FaStepBackward, FaFastBackward } from "react-icons/fa";
import {Button} from "@mantine/core";
import FlipBoardButton from "./FlipBoardButton.tsx";


function TurnHistory(
    { turnHistory, viewMoveIndex, setViewMoveIndex, setView }:
    { turnHistory: Turn[], viewMoveIndex: number, setViewMoveIndex: Dispatch<SetStateAction<number>>, setView?: Dispatch<SetStateAction<Color>> })
{



    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {

            switch (e.key) {
                case "ArrowRight":
                    if (document.activeElement == document.getElementById("chat-input"))
                        break;
                    if (e.shiftKey)
                        handleFastForward();
                    else
                        handleStepForward();
                    break;
                case "ArrowLeft":
                    if (document.activeElement == document.getElementById("chat-input"))
                        break;
                    if (e.shiftKey)
                        handleFastBackward();
                    else
                        handleStepBackward();
                    break;
            }
        }
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    })

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
                className={`px-1 py-0.5 flex-1 rounded-md transition-colors hover:cursor-pointer ${viewMoveIndex == turnViewIndex+1 || (viewMoveIndex === -1 && turnViewIndex === turnHistory.length-1) ? "bg-fg-1/50" : "hover:bg-fg-1/30"}`}
            >
                {content}
            </div>)
        }
        turnRows.push(row)
        i += 2
    }

    function handleStepBackward() {
        if (viewMoveIndex == -1)
            setViewMoveIndex(turnHistory.length - 1);
        else
            setViewMoveIndex((prev) => Math.max(0, prev-1))
    }

    function handleFastBackward() {
        setViewMoveIndex(0);
    }

    function handleStepForward() {
        if (viewMoveIndex == -1) return;
        let newViewMoveIndex = viewMoveIndex+1
        if (newViewMoveIndex >= turnHistory.length) newViewMoveIndex = -1
        setViewMoveIndex(newViewMoveIndex)
    }

    function handleFastForward() {
        setViewMoveIndex(-1);
    }

    return (
        <div className={"flex flex-col justify-between h-full text-white text-base p-1"}>
            <ol className={"flex flex-col justify-between overflow-y-auto pb-1"}>
                {turnRows.map((row, i) => (
                    <div key={i} className={"flex flex-row justify-between"}>
                        <div className={"px-1 py-0.5 text-gray-400"}>{i}</div>
                        {row[0]}
                        {row[1]}
                    </div>
                ))}
            </ol>


            {/* Buttons */}
            <div className={"flex flex-col justify-between "}>

                {/* Misc Buttons */}
                <div className={"flex flex-row justify-end "}>
                    {setView && <FlipBoardButton setView={setView}/>}
                </div>

                {/* Turn History Button Controls*/}
                <div className={"flex flex-row justify-between pt-2"}>
                    <Button
                        color={"var(--color-fg-1)"}
                        onClick={handleFastBackward}
                        disabled={viewMoveIndex === 0}
                        className={"transition-colors hover:bg-fg-1/50 disabled:bg-fg-1/50!"}
                    >
                        <FaFastBackward color={viewMoveIndex === 0 ? "gray" : "white"}/>
                    </Button>

                    <Button
                        color={"var(--color-fg-1)"}
                        onClick={handleStepBackward}
                        disabled={viewMoveIndex === 0}
                        className={"transition-colors hover:bg-fg-1/50 disabled:bg-fg-1/50!"}
                    >
                        <FaStepBackward color={viewMoveIndex === 0 ? "gray" : "white"}/>
                    </Button>

                    <Button
                        color={"var(--color-fg-1)"}
                        onClick={handleStepForward}
                        disabled={viewMoveIndex === -1}
                        className={"transition-colors hover:bg-fg-1/50 disabled:bg-fg-1/50!"}
                    >
                        <FaStepForward color={viewMoveIndex === -1 ? "gray" : "white"}/>
                    </Button>

                    <Button
                        color={"var(--color-fg-1)"}
                        onClick={handleFastForward}
                        disabled={viewMoveIndex === -1}
                        className={"transition-colors hover:bg-fg-1/50 disabled:bg-fg-1/50!"}
                    >
                        <FaFastForward color={viewMoveIndex === -1 ? "gray" : "white"}/>
                    </Button>
                </div>
            </div>

        </div>
    )
}


export default TurnHistory;