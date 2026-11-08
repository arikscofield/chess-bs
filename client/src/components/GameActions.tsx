import {type Dispatch, type SetStateAction} from "react";
import {Button} from "@mantine/core";
import {
    Color,
    type GameDrawAcceptRequest,
    type GameDrawDeclineRequest,
    GameResult,
    GameStatus,
    type GenericCallback
} from "@chess-bs/common";
import {useSocket} from "./context/SocketContext.ts";
import {IoCheckmark, IoClose} from "react-icons/io5";
import ResignButton from "./ResignButton.tsx";
import DrawButton from "./DrawButton.tsx";
import RematchButton from "./RematchButton.tsx";
import {useNavigate} from "react-router";


const RESULT_TEXT: [Record<Color, Record<GameResult, string>>, Record<GameResult, string>] = [
    {
        [Color.White]: {[GameResult.White]: "You won!", [GameResult.Black]: "You lost", [GameResult.Draw]: "Draw"},
        [Color.Black]: {[GameResult.White]: "You lost", [GameResult.Black]: "You won!", [GameResult.Draw]: "Draw"}
    },
    {[GameResult.White]: "White won", [GameResult.Black]: "Black won", [GameResult.Draw]: "Draw"},
]

function GameActions({gameId, color, drawOfferedColor, setDrawOfferedColor, gameStatus, gameResult, gameResultReason, isSpectating}: {
    gameId: string,
    color: Color,
    drawOfferedColor: Color | null,
    setDrawOfferedColor: Dispatch<SetStateAction<Color | null>>,
    gameStatus?: GameStatus,
    gameResult?: GameResult,
    gameResultReason?: string,
    isSpectating?: boolean

}) {
    const socket = useSocket();
    const navigate = useNavigate();

    function declineDrawOffer() {
        if (!socket) return;

        const payload: GameDrawDeclineRequest = {
            gameId: gameId,
        }
        socket.emit("game:draw:decline", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                return;
            } else {
                setDrawOfferedColor(null);
            }
        }) as GenericCallback)
    }

    function acceptDrawOffer() {
        if (!socket) return;

        const payload: GameDrawAcceptRequest = {
            gameId: gameId,
        }
        socket.emit("game:draw:accept", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                return;
            } else {
                setDrawOfferedColor(null);
            }
        }) as GenericCallback)
    }

    // Game over UI
    if (gameStatus === GameStatus.DONE) {
        const resultText = isSpectating
            ? RESULT_TEXT[1][gameResult ?? GameResult.White]
            : RESULT_TEXT[0][color ?? Color.White][gameResult ?? GameResult.White]
        const won = !isSpectating && gameResult !== GameResult.Draw && (gameResult as string) === (color as string);
        const lost = !isSpectating && gameResult !== GameResult.Draw && !won;

        return (<div className={"flex flex-col gap-3 w-full"}>
            <div className={`flex flex-col items-center gap-0.5 rounded-lg py-3 px-2 border
                ${won ? "bg-success/10 border-success/30" : lost ? "bg-danger/10 border-danger/25" : "bg-white/5 border-white/10"}`}
            >
                <div className={`text-lg font-bold text-center ${won ? "text-success" : lost ? "text-red-300" : "text-fg-2"}`}>{resultText}</div>
                {gameResultReason && <div className={"text-sm text-center text-fg-3"}>{gameResultReason}</div>}
            </div>
            {!isSpectating && <div className={"flex flex-col gap-2"}>
                <RematchButton gameId={gameId}/>
                <Button variant={"default"} fullWidth onClick={() => navigate("/")}>New game</Button>
            </div>}
        </div>)
    }

    if (isSpectating) {
        return null;
    }

    // Received draw offer; show decline/accept buttons
    if (drawOfferedColor && drawOfferedColor !== color) {
        return (<div className={"flex flex-col gap-2 w-full rounded-lg border border-fg-1/30 bg-fg-1/10 p-2"}>
            <p className={"flex justify-center items-center text-sm px-1"}>Your opponent offers a draw</p>
            <div className={"flex flex-row gap-2"}>
                <Button
                    fullWidth
                    color={"red"}
                    leftSection={<IoClose size={16}/>}
                    onClick={declineDrawOffer}
                >
                    Decline
                </Button>
                <Button
                    fullWidth
                    color={"green"}
                    leftSection={<IoCheckmark size={16}/>}
                    onClick={acceptDrawOffer}
                >
                    Accept
                </Button>
            </div>
        </div>)
    }

    // Typical in-game resign/draw buttons
    return (<div className={"flex flex-row gap-2 w-full"}>
        <ResignButton gameId={gameId}/>
        <DrawButton gameId={gameId} drawOfferedColor={drawOfferedColor}/>
    </div>)
}


export default GameActions;