import {ActionIcon, Button, Loader, Tooltip} from "@mantine/core";
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
            resetConfirmingTimeout.current = window.setTimeout(() => {
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


    const label = waitingForResponse
        ? "Draw offered"
        : sentOffer
            ? "Draw declined"
            : confirming
                ? "Confirm"
                : "Offer draw";

    return (
        <div className={"flex flex-row flex-1 gap-1"}>
            <Button
                fullWidth
                variant={confirming ? "filled" : "default"}
                onClick={handleClick}
                disabled={sentOffer && !waitingForResponse}
                leftSection={waitingForResponse ? <Loader size={12} color={"var(--color-fg-3)"}/> : <span className={"font-bold"}>½</span>}
                className={waitingForResponse ? "pointer-events-none" : ""}
            >
                {label}
            </Button>
            {(confirming || waitingForResponse) && <Tooltip label={waitingForResponse ? "Cancel draw offer" : "Cancel"}>
                <ActionIcon variant={"default"} size={36} onClick={handleCancel} aria-label={"Cancel"}>
                    <IoClose size={18}/>
                </ActionIcon>
            </Tooltip>}
        </div>

    )
}


export default DrawButton;