import {useEffect, useState} from "react";


function Timer({baseMs, anchorMs, isRunning, }: {baseMs: number | undefined, anchorMs: number, isRunning: boolean, }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isRunning) return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, [isRunning, anchorMs, baseMs]);

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


    if (typeof baseMs !== "number") return null;

    const elapsed = isRunning ? Math.max(0, now - anchorMs) : 0;
    const clockMs = Math.max(0, baseMs - elapsed);
    const isLowTime = clockMs <= 30000 && clockMs > 0;

    return <div className={`px-5 py-1.5 rounded-md text-lg font-bold transition-all duration-300 border-2
    ${clockMs <= 0 
        ? "bg-red-500/10 text-red-400/80 border-red-500/20"
        : isRunning 
            ? isLowTime 
                ? "bg-orange-500/10 text-orange-400/80 border-orange-500/20"
                : "bg-bg-2/50 text-fg-2 border-white/10"
            : isLowTime
                ? "bg-orange-500/10 text-orange-400/50 border-orange-500/10"
                : "bg-bg-2/30 text-fg-3 border-white/10"
    }
    `}
    >
        {formatTime(clockMs)}
    </div>
}

export default Timer;