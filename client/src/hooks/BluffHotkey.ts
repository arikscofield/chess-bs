import {type Dispatch, type SetStateAction, useEffect} from "react";

function isTypingTarget(target: EventTarget | null) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        || (target instanceof HTMLElement && target.isContentEditable);
}

/** Space toggles bluff mode */
export function useBluffHotkey(setIsBluffing: Dispatch<SetStateAction<boolean>>, enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== " " || e.repeat || isTypingTarget(e.target)) return;
            // Also stop a focused button from being "clicked" by the same keypress
            e.preventDefault();
            setIsBluffing(prev => !prev);
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [setIsBluffing, enabled]);
}
