import {Button} from "@mantine/core";
import {useSocket} from "./context/SocketContext.ts";
import {type GameMoveBluffCallRequest, type GenericCallback} from "@chess-bs/common";


function CallBluffButton({ gameId }: {gameId: string}) {
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

    return <Button
        color={"green"}
        w={120}
        onClick={handleCallBluff}
        className={""}
    >
        Call Bluff
    </Button>
}


export default CallBluffButton;