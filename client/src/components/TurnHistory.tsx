import {type Dispatch, type ReactNode, type SetStateAction, useEffect, useRef} from "react";
import {Color, IndexToFile, PieceAscii, type Turn} from "@chess-bs/common";
import { FaStepForward, FaFastForward, FaStepBackward, FaFastBackward } from "react-icons/fa";
import {ActionIcon, Kbd, Tooltip} from "@mantine/core";
import FlipBoardButton from "./FlipBoardButton.tsx";


function isTypingTarget(target: EventTarget | null) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        || (target instanceof HTMLElement && target.isContentEditable);
}

function turnContent(turn: Turn | null): ReactNode {
    if (turn === null)
        return <span className={"italic text-fg-3/70"}>skipped</span>;
    if ("successful" in turn)
        return turn.successful
            ? <span className={"font-medium text-success"}>Bluff caught</span>
            : <span className={"font-medium text-red-400"}>Wrong call</span>;
    if (turn.notation)
        return turn.notation;
    return PieceAscii[turn.piece.color][turn.piece.type] + IndexToFile[turn.from.col] + (8 - turn.from.row)
        + "–" + IndexToFile[turn.to.col] + (8 - turn.to.row);
}

function TurnHistory({turnHistory, viewMoveIndex, setViewMoveIndex, setView, playerColor}: {
    turnHistory: Turn[],
    viewMoveIndex: number,
    setViewMoveIndex: Dispatch<SetStateAction<number>>,
    setView?: (prev: SetStateAction<Color | undefined>) => void,
    playerColor: Color,
}){
    const listRef = useRef<HTMLDivElement>(null);

    // Hotkeys for steping forward/backward
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (isTypingTarget(e.target)) return;
            switch (e.key) {
                case "ArrowRight":
                    if (e.shiftKey) handleFastForward();
                    else handleStepForward();
                    break;
                case "ArrowLeft":
                    if (e.shiftKey) handleFastBackward();
                    else handleStepBackward();
                    break;
            }
        }
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    })

    // Keep the selected (or latest) move in view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const active = list.querySelector<HTMLElement>("[data-active=true]");
        if (active) active.scrollIntoView({block: "nearest"});
        else if (viewMoveIndex === -1) list.scrollTop = list.scrollHeight;
    }, [turnHistory.length, viewMoveIndex]);

    // A correct bluff call skips the bluffer's next turn, so insert a placeholder
    // to keep columns aligned.
    const parsedTurnHistory: ([Turn | null, number])[] = [];
    for (const [i, turn] of turnHistory.entries()) {
        parsedTurnHistory.push([turn, i]);
        if ("successful" in turn && turn.successful) {
            parsedTurnHistory.push([null, i]);
        }
    }

    const rows: ([Turn | null, number] | undefined)[][] = [];
    for (let i = 0; i < parsedTurnHistory.length; i += 2) {
        rows.push([parsedTurnHistory[i], parsedTurnHistory[i + 1]]);
    }

    function isActive(turnViewIndex: number) {
        return viewMoveIndex == turnViewIndex + 1 || (viewMoveIndex === -1 && turnViewIndex === turnHistory.length - 1);
    }

    function handleStepBackward() {
        if (viewMoveIndex == -1)
            setViewMoveIndex(turnHistory.length - 1);
        else
            setViewMoveIndex((prev) => Math.max(0, prev-1));
    }

    function handleFastBackward() {
        setViewMoveIndex(0);
    }

    function handleStepForward() {
        if (viewMoveIndex == -1) return;
        let newViewMoveIndex = viewMoveIndex+1;
        if (newViewMoveIndex >= turnHistory.length) newViewMoveIndex = -1;
        setViewMoveIndex(newViewMoveIndex);
    }

    function handleFastForward() {
        setViewMoveIndex(-1);
    }

    const atStart = viewMoveIndex === 0 || turnHistory.length === 0;
    const atEnd = viewMoveIndex === -1;

    const navButtons: { label: string, hotkey: string, modifier: string, icon: ReactNode, onClick: () => void, disabled: boolean }[] = [
        {label: "First move", hotkey: "←", modifier: "Shift", icon: <FaFastBackward size={13}/>, onClick: handleFastBackward, disabled: atStart},
        {label: "Previous move", hotkey: "←", modifier: "", icon: <FaStepBackward size={13}/>, onClick: handleStepBackward, disabled: atStart},
        {label: "Next move", hotkey: "→", modifier: "", icon: <FaStepForward size={13}/>, onClick: handleStepForward, disabled: atEnd},
        {label: "Latest move", hotkey: "→", modifier: "Shift", icon: <FaFastForward size={13}/>, onClick: handleFastForward, disabled: atEnd},
    ];

    return (
        <div className={"flex flex-col h-full"}>

            {/* Turns */}
            <div ref={listRef} className={"flex-1 min-h-0 overflow-y-auto px-1.5 py-1.5"}>
                {rows.length === 0
                    ? <div className={"flex items-center justify-center h-full min-h-16 text-sm text-fg-3/70"}>
                        No moves yet
                    </div>
                    : <ol className={"grid grid-cols-[2.25rem_1fr_1fr] gap-x-1 text-sm"}>
                        {rows.map((row, i) => (
                            <li key={i} className={`contents`}>
                                <div className={"py-1 pr-2 text-right text-fg-3/60 tabular"}>{i + 1}.</div>
                                {row.map((cell, j) => {
                                    if (!cell) return <div key={j}/>;
                                    const [turn, turnViewIndex] = cell;
                                    const active = isActive(turnViewIndex);
                                    return <button
                                        key={j}
                                        type={"button"}
                                        data-active={active}
                                        onClick={() => setViewMoveIndex(turnViewIndex + 1)}
                                        className={`text-left px-2 py-1 rounded-md truncate transition-colors cursor-pointer
                                            ${active ? "bg-fg-1/25 text-fg-2 font-semibold" : "text-fg-2/85 hover:bg-white/5"}`}
                                    >
                                        {turnContent(turn)}
                                    </button>
                                })}
                            </li>
                        ))}
                    </ol>}
            </div>

            {/* Navigation */}
            <div className={"flex flex-row items-center gap-1 px-1.5 py-1.5 border-t border-white/5 shrink-0"}>
                {navButtons.map(b => (
                    <Tooltip
                        key={b.label}
                        label={
                        // `${b.label} (${b.hotkey})`
                            <div dir={"ltr"}>
                                {b.label}
                                {`  `}
                                {b.modifier && <Kbd size={"xs"} className={"inline-block opacity-70"}>{b.modifier}</Kbd>}
                                {b.modifier && "+"}
                                <Kbd size={"xs"} className={"inline-block opacity-70"}>{b.hotkey}</Kbd>

                            </div>
                        }
                    >
                        <ActionIcon
                            variant={"subtle"}
                            color={"gray"}
                            size={"lg"}
                            className={"flex-1 data-disabled:bg-transparent data-disabled:opacity-35"}
                            onClick={b.onClick}
                            disabled={b.disabled}
                            aria-label={b.label}
                        >
                            {b.icon}
                        </ActionIcon>
                    </Tooltip>
                ))}
                {setView && <FlipBoardButton setView={setView} playerColor={playerColor}/>}
            </div>
        </div>
    )
}


export default TurnHistory;