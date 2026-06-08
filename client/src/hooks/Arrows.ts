import {type Square, squareEqual} from "@chess-bs/common";
import {type PointerEvent as ReactPointerEvent, useCallback, useRef, useState} from "react";

export interface Arrow {
    from: Square;
    to: Square;
    color: string;
}

const ARROW_COLOR = "#ff0505";

function colorForModifiers(e: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean }) {
    if (e.shiftKey) return '#882020';   // red
    if (e.altKey)   return '#003088';   // blue
    if (e.ctrlKey)  return '#e68f00';   // yellow
    return '#15781B';                   // green (default)
}

export function useArrows() {
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const [draft, setDraft] = useState<Arrow | null>(null);
    const draftRef = useRef<Arrow | null>(null);
    const dragStartSquare = useRef<Square | null>(null);


    const onRightPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>, square: Square) => {
        if (e.button !== 2) return;
        dragStartSquare.current = square;

        const newDraft: Arrow = { from: square, to: square, color: colorForModifiers(e) }
        setDraft(newDraft);
        draftRef.current = newDraft;
    }, []);

    const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>, square: Square) => {
        if (!dragStartSquare.current) return;
        const newDraft: Arrow = { from: dragStartSquare.current, to: square, color: colorForModifiers(e) };
        if (squareEqual(newDraft.from, draftRef.current?.from) &&
            squareEqual(newDraft.to, draftRef.current?.to) &&
            newDraft.color === draftRef.current?.color) {
            return;
        }

        setDraft(newDraft);
        draftRef.current = newDraft;
    }, []);

    const onRightPointerUp = useCallback((e: ReactPointerEvent<HTMLElement>, square: Square) => {
        if (e.button !== 2 || !dragStartSquare.current) return;

        const from = dragStartSquare.current;
        dragStartSquare.current = null;
        setDraft(null);
        draftRef.current = null;

        const color = colorForModifiers(e);
        setArrows(prev => {
            const i = prev.findIndex(a => squareEqual(a.from, from) && squareEqual(a.to, square));
            if (i !== -1) {
                // same color -> remove (toggle); different -> recolor
                if (prev[i].color === color) return prev.filter((_, j) => j !== i);
                return prev.map((a, j) => (j === i ? { ...a, color } : a));
            }
            return [...prev, { from, to: square, color }];
        });
    }, []);

    const onContextMenu = useCallback((e: MouseEvent) => e.preventDefault(), []);
    const clear = useCallback(() => setArrows([]), []);

    return {
        arrows, draft, clear,
        handlers: { onRightPointerDown, onPointerMove, onRightPointerUp, onContextMenu },
    };
}