import {Button} from "@mantine/core";
import {useSocket} from "./context/SocketContext.ts";
import {type GameMoveBluffCallRequest, type GenericCallback} from "@chess-bs/common";


function CallBluffButtonBase({ onClick, disabled = false} : {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Button color={"green"} w={120} onClick={onClick} disabled={disabled}>
            Call Bluff
        </Button>
    )
}


export function CallBluffButtonOnline({ gameId, disabled = false }: {
    gameId: string,
    disabled?: boolean,
}) {
    const socket = useSocket();

    function handleCallBluff() {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        const payload: GameMoveBluffCallRequest = {
            gameId: gameId,
        }
        socket.emit("game:move:bluff:call", payload, ((ok, message) => {
            if (!ok) {
                console.error(message);
                return;
            }

            console.log(message)
        }) as GenericCallback)
    }

    return <CallBluffButtonBase onClick={handleCallBluff} disabled={disabled}/>
}

export function CallBluffButtonLocal({ onCallBluff, disabled = false }: {
    onCallBluff: () => void,
    disabled?: boolean,
}) {
    return <CallBluffButtonBase onClick={onCallBluff} disabled={disabled}/>
}
