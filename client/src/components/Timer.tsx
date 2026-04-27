

function Timer({clockMs, isRunning, }: {clockMs: number | undefined, isRunning: boolean, }) {

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
            result += (hours < 10 ? "0" + hours : hours) + ":";
        result += (hours !== 0 && minutes < 10 ? "0" + minutes : minutes) + ":";
        result += seconds < 10 ? "0" + seconds : seconds;
        if (hours === 0 && minutes === 0 && seconds < 10)
            result += "." + tenths;

        return result
    }


    if (typeof clockMs !== "number") {
        return;
    }

    return (<div className={`flex justify-center items-center w-[100px] h-[50px] my-1 px-1 pb-0.5 rounded-md
     ${clockMs <= 0 ? "bg-red-400/30" : isRunning ? "bg-lime-700/50" : "bg-bg-2"}
     `}>
        <p className={`text-3xl text-center ${isRunning ? "text-white" : "text-gray-400"}}`}>
            {formatTime(clockMs)}
        </p>
    </div>)
}

export default Timer;