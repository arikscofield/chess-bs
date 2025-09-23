import {Button} from "@mantine/core";
import {useContext} from "react";
import {SocketContext} from "./Socket/SocketContext.ts";
import {AckStatus} from "@chess-bs/common";


function CallBluffButton({ gameId }: {gameId: string}) {
    const socket = useContext(SocketContext);

    function handleCallBluff() {
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        socket.emit("callBluff", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                if (response.result) {
                    console.log("Bluff successful");
                } else {
                    console.log("Bluff failed");
                }
            } else {
                console.error(response.message);
            }
        })
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