import {type Dispatch, type SetStateAction} from "react";
import {Button} from "@mantine/core";
import {
    Color,
    type GameDrawAcceptRequest,
    type GameDrawDeclineRequest,
    GameResult, GameStatus,
    type GenericCallback
} from "@chess-bs/common";
import {useSocket} from "./context/SocketContext.ts";
import {IoCheckmark, IoClose} from "react-icons/io5";
import ResignButton from "./ResignButton.tsx";
import DrawButton from "./DrawButton.tsx";
import RematchButton from "./RematchButton.tsx";


function GameActions({gameId, color, drawOfferedColor, setDrawOfferedColor, gameStatus, gameResult, gameResultReason}: {
    gameId: string,
    color: Color,
    drawOfferedColor: Color | null,
    setDrawOfferedColor: Dispatch<SetStateAction<Color | null>>,
    gameStatus?: GameStatus,
    gameResult?: GameResult,
    gameResultReason?: string,

}) {
    const socket = useSocket();

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
        const resultText = gameResult === GameResult.Draw ? "You Tied" :
            gameResult === GameResult.White && color === Color.White || gameResult === GameResult.Black && color === Color.Black ? "You Won!" : "You Lost";

        return (<div className={"flex flex-col gap-3 w-full"}>
            <div className={"flex flex-col justify-center items-center gap-1"}>
                <div className={"text-xl font-bold text-center"}>{resultText}</div>
                <div className={"text-sm text-center text-gray-300"}>{gameResultReason}</div>
            </div>
            <RematchButton gameId={gameId}/>
        </div>)
    }

    // Received draw offer; show decline/accept buttons
    if (drawOfferedColor && drawOfferedColor !== color) {
        return (<div className={"flex flex-row justify-between w-full"}>
            <div>
                <Button
                    color={"red"}
                    onClick={declineDrawOffer}
                >
                    <IoClose size={20}/>
                </Button>
            </div>
            <p className={"flex justify-center items-center text-sm px-1"}>Opponent offers a draw</p>
            <div>
                <Button
                    color={"green"}
                    onClick={acceptDrawOffer}
                >
                    <IoCheckmark size={20}/>
                </Button>
            </div>
        </div>)
    }

    // Typical in-game resign/draw buttons
    return (<div className={"flex flex-row justify-around w-full"}>
        <ResignButton gameId={gameId}/>
        <DrawButton gameId={gameId} drawOfferedColor={drawOfferedColor}/>
    </div>)
}


export default GameActions;