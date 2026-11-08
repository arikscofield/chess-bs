import {useSocket} from "./context/SocketContext.ts";
import {ActionIcon, Button, Loader, Tooltip} from "@mantine/core";
import type {
    GameRematchAcceptRequest, GameRematchCancelOfferRequest,
    GameRematchOfferRequest,
    GenericCallback
} from "@chess-bs/common";
import {useEffect, useState} from "react";
import {IoClose} from "react-icons/io5";
import {LuRefreshCw} from "react-icons/lu";


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

    return (<div className={"flex flex-row gap-1 w-full"}>
        <Button
            onClick={onClick}
            disabled={sentOffer && !waitingForResponse}
            variant={"filled"}
            fullWidth={true}
            leftSection={waitingForResponse ? <Loader size={12} color={"white"}/> : <LuRefreshCw size={15}/>}
            className={`${receivedOffer ? "animate-pulse" : ""} ${waitingForResponse ? "pointer-events-none" : ""}`}
        >
            {receivedOffer ? "Accept rematch" : waitingForResponse ? "Rematch offered" : sentOffer ? "Rematch declined" : "Rematch"}
        </Button>

        {waitingForResponse && <Tooltip label={"Cancel rematch offer"}>
            <ActionIcon variant={"default"} size={36} onClick={onCancel} aria-label={"Cancel rematch offer"}>
                <IoClose size={18}/>
            </ActionIcon>
        </Tooltip>}
    </div>)
}


export default RematchButton;