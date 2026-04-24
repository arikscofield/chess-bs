import {useSocket} from "./context/SocketContext.ts";
import {Button} from "@mantine/core";
import type {
    GameRematchAcceptRequest, GameRematchCancelOfferRequest,
    GameRematchOfferRequest,
    GenericCallback
} from "@chess-bs/common";
import {useEffect, useState} from "react";
import {IoClose} from "react-icons/io5";


function RematchButton({gameId}: {
    gameId: string,
}) {
    const socket = useSocket();

    const [sentOffer, setSentOffer] = useState<boolean>(false);
    const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
    const [receivedOffer, setReceivedOffer] = useState<boolean>(false);



    useEffect(() => {
        if (!socket) return;

        socket.on("game:rematch:offered", handleReceivedOffer);
        socket.on("game:rematch:declined", handleReceivedDeclined);
        socket.on("game:rematch:cancelled", handleReceivedCancelled);


        return () => {
            socket.off("game:rematch:offered", handleReceivedOffer);
            socket.off("game:rematch:declined", handleReceivedDeclined);
            socket.off("game:rematch:cancelled", handleReceivedCancelled);
        }

    }, [socket])


    function handleReceivedOffer() {
        setReceivedOffer(true);
    }

    function handleReceivedDeclined() {
        setWaitingForResponse(false);
    }

    function handleReceivedCancelled() {
        setReceivedOffer(false);
    }

    function onClick() {
        if (!socket) {
            console.error("Not connected to server");
            return;
        }

        if (receivedOffer) {
            const payload: GameRematchAcceptRequest = {
                gameId: gameId,
            }
            socket.emit("game:rematch:accept", payload, ((ok, message) => {
                if (!ok) {
                    console.error(message);
                    return;
                }

            }) as GenericCallback)
        } else if (!sentOffer) {
            const payload: GameRematchOfferRequest = {
                gameId: gameId,
            }
            socket.emit("game:rematch:offer", payload, ((ok, message) => {
                if (!ok) {
                    console.error(message);
                    return;
                }
                setSentOffer(true);
            }) as GenericCallback)

            setWaitingForResponse(true);
        }


    }

    function onCancel() {
        if (!socket) {
            console.error("Not connected to server")
            return;
        }

        const payload: GameRematchCancelOfferRequest = {
            gameId: gameId,
        }
        socket.emit("game:rematch:cancel-offer", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                return;
            }
            setSentOffer(false);
            setWaitingForResponse(false);
        }) as GenericCallback)
    }

    return (<div className={"flex justify-center self-center relative w-[80%]"}>
        <Button
            onClick={onClick}
            loading={waitingForResponse}
            disabled={sentOffer && !waitingForResponse}
            variant={receivedOffer ? "filled" : "outline"}
            fullWidth={true}
            color={"var(--color-fg-1)"}
            className={`transition-all duration-200 ${receivedOffer ? "animate-pulse" : ""}`}
        >
            {receivedOffer ? "Accept Rematch" : "Rematch"}
        </Button>

        {waitingForResponse && <button
            onClick={onCancel}
            className={`block absolute items-center h-full right-[-30px] m-0 p-0 text-fg-1 hover:bg-fg-1/20 hover:cursor-pointer rounded-md px-1.5`}
        >
            <IoClose size={20}/>
        </button>}
    </div>)
}


export default RematchButton;