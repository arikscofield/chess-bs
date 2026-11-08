import {useEffect, useState} from "react";


function formatTime(timeMs: number): string {
    let result = "";
    const negative = timeMs < 0;
    if (negative) {
        timeMs = -timeMs;
        result += "-";
    }
    const tenths = Math.floor(timeMs % 1000 / 100);
    const seconds = Math.floor((timeMs / 1000) % 60);
    const minutes = Math.floor((timeMs / (60 * 1000)) % 60);
    const hours = Math.floor((timeMs / (60 * 60 * 1000)) % 60);

    if (hours > 0)
        result += hours + ":";
    result += (hours !== 0 && minutes < 10 ? "0" + minutes : minutes) + ":";
    result += seconds < 10 ? "0" + seconds : seconds;
    if (hours === 0 && minutes === 0 && seconds < 10)
        result += "." + tenths;

    return result
}

function Timer({baseMs, anchorMs, isRunning, }: {
    baseMs: number | undefined,
    anchorMs: number,
    isRunning: boolean,
}) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isRunning) return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, [isRunning, anchorMs, baseMs]);


    if (typeof baseMs !== "number") return null;

    const elapsed = isRunning ? Math.max(0, now - anchorMs) : 0;
    const clockMs = Math.max(0, baseMs - elapsed);
    const isLowTime = clockMs <= 30000 && clockMs > 0;


    const style = clockMs <= 0
        ? "bg-danger/20 text-red-300"
        : isRunning
            ? isLowTime
                ? "bg-danger text-white"
                : "bg-fg-2 text-bg-1"
            : isLowTime
                ? "bg-danger/15 text-red-300"
                : "bg-bg-1/70 text-fg-3";

    return <div
        className={`min-w-22 px-3 py-1 rounded-md text-xl font-bold font-mono tabular text-right transition-colors duration-200 ${style}`}
        role={"timer"}
    >
        {formatTime(clockMs)}
    </div>
}

export default Timer;