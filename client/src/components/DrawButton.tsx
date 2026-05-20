import {Button} from "@mantine/core";
import { IoClose } from "react-icons/io5";
import {useEffect, useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {
    Color,
    GameDrawCancelOfferRequest,
    GameDrawOfferRequest,
    GenericCallback
} from "@chess-bs/common";

function DrawButton(
    {gameId, drawOfferedColor}:
    {gameId: string, drawOfferedColor: Color | null}) {
    const socket = useSocket();

    const [confirming, setConfirming] = useState<boolean>(false);
    const [sentOffer, setSentOffer] = useState<boolean>(false);
    const [waitingForResponse, setWaitingForResponse] = useState<boolean>(!!drawOfferedColor);
    
    const resetConfirmingTimeout = useRef<number>(0);
    
    useEffect(() => {
        if (!socket) return;

        function handleReceivedDeclined() {
            setWaitingForResponse(false);
            setTimeout(() => {
                setSentOffer(false);
            }, 20000)
        }

        socket.on("game:draw:declined", handleReceivedDeclined)

        return () => {
            socket.off("game:draw:declined", handleReceivedDeclined)
        }

    }, [socket])

    useEffect(() => {
        setWaitingForResponse(!!drawOfferedColor);
    }, [drawOfferedColor])


    function handleClick() {
        if (!socket) {
            console.error("Not connected to server")
            return;
        }

        if (confirming && !sentOffer) {
            const payload: GameDrawOfferRequest = {
                gameId: gameId,
            }
            socket.emit("game:draw:offer", payload, ((ok, message) => {
                if (!ok) {
                    setWaitingForResponse(false)
                    console.error(message);
                    return;
                } else {
                    setSentOffer(true);
                }
            }) as GenericCallback)
            setWaitingForResponse(true);
            setConfirming(false)
        } else if (!sentOffer) {
            setConfirming(true);
            resetConfirmingTimeout.current = setTimeout(() => {
                setConfirming(false);
            }, 5000)
        }
    }

    function handleCancel() {
        if (waitingForResponse) {
            if (!socket) {
                console.error("Not connected to server")
                return;
            }

            const payload: GameDrawCancelOfferRequest = {
                gameId: gameId,
            }
            socket.emit("game:draw:cancel-offer", payload, ((ok, message) => {
                if (!ok) {
                    console.error(message);
                    return;
                }
                setSentOffer(false);
                setWaitingForResponse(false);
            }) as GenericCallback)
        } else {
            setConfirming(false);
            clearTimeout(resetConfirmingTimeout.current);
        }

    }


    return (
        <div className={"flex justify-center relative"}>
            <Button
                color={confirming ? "teal" : "var(--color-fg-1)"}
                onClick={handleClick}
                mr={0}
                loading={waitingForResponse}
                disabled={sentOffer && !waitingForResponse}
                className={`transition-colors `}
            >
                {/*<FaRegFlag />*/}
                Draw
            </Button>
            {(confirming || waitingForResponse) && <button
                onClick={handleCancel}
                className={`block absolute items-center h-full right-[-30px] m-0 p-0 text-fg-1 hover:bg-fg-1/20 hover:cursor-pointer rounded-md px-1.5`}
            >
                <IoClose size={20}/>
            </button>}
        </div>

    )
}


export default DrawButton;