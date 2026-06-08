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

    return (<div className={`flex justify-center items-center w-[100px] h-[50px] my-1 px-1 pb-0.5 rounded-md
     ${clockMs <= 0 ? "bg-red-400/30" : isRunning ? "bg-lime-700/50" : "bg-bg-2"}
     `}>
        <p className={`text-3xl text-center ${isRunning ? "text-white" : "text-gray-400"}`}>
            {formatTime(clockMs)}
        </p>
    </div>)
}

export default Timer;