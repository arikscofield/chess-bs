import {Button} from "@mantine/core";
import { IoClose } from "react-icons/io5";
import {useCallback, useEffect, useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {
    GameDrawAcceptRequest, GameDrawCancelOfferRequest,
    GameDrawOfferRequest,
    GenericCallback
} from "@chess-bs/common";

function DrawButton(
    {gameId, receivedDrawOfferProps, setReceivedDrawOfferProps}:
    {gameId: string, receivedDrawOfferProps?: boolean, setReceivedDrawOfferProps?: (value: boolean) => void}) {
    const socket = useSocket();

    const [confirming, setConfirming] = useState<boolean>(false);
    const [receivedOfferInternal, setReceivedOfferInternal] = useState<boolean>(false);
    const [sentOffer, setSentOffer] = useState<boolean>(false);
    const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
    
    const resetConfirmingTimeout = useRef<number>(0);
    
    const isControlled = receivedDrawOfferProps !== undefined;
    const receivedOffer = isControlled ? receivedDrawOfferProps : receivedOfferInternal;

    const setReceivedOffer = useCallback((value: boolean) => {
        if (setReceivedDrawOfferProps) {
            setReceivedDrawOfferProps(value);
        }
        
        if (!isControlled) {
            setReceivedOfferInternal(value);
        }
    }, [isControlled, setReceivedDrawOfferProps])
    
    useEffect(() => {
        if (!socket) return;

        function handleReceivedOffer() {
            setReceivedOffer(true);
        }

        function handleReceivedDeclined() {
            setWaitingForResponse(false);
            setTimeout(() => {
                setSentOffer(false);
            }, 20000)
        }

        function handleReceivedCancelled() {
            setReceivedOffer(false);
        }

        socket.on("game:draw:offered", handleReceivedOffer)
        socket.on("game:draw:declined", handleReceivedDeclined)
        socket.on("game:draw:cancelled", handleReceivedCancelled)

        return () => {
            socket.off("game:draw:offered", handleReceivedOffer)
            socket.off("game:draw:declined", handleReceivedDeclined)
            socket.off("game:draw:cancelled", handleReceivedCancelled)
        }

    }, [setReceivedOffer, socket])


    function acceptOffer() {
        if (!socket) return;

        const payload: GameDrawAcceptRequest = {
            gameId: gameId,
        }
        socket.emit("game:draw:accept", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                return;
            } else {
                setReceivedOffer(false);
            }
        }) as GenericCallback)
    }


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
        } else if (receivedOffer) {
            acceptOffer();
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


    if (receivedOffer) {
        return(<div className={"flex justify-center grow pt-1"}>

        </div>)
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