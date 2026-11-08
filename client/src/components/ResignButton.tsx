import {ActionIcon, Button, Tooltip} from "@mantine/core";
import { FaRegFlag, } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {useEffect, useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {GameResignRequest, GenericCallback} from "@chess-bs/common";

function ResignButton({gameId}: {gameId: string}) {
    const socket = useSocket();

    const [confirming, setConfirming] = useState<boolean>(false);
    const resetConfirmingTimeout = useRef<number>(0);

    useEffect(() => () => clearTimeout(resetConfirmingTimeout.current), []);

    function handleClick() {
        if (confirming) {
            if (!socket) {
                console.error("Not connected to server")
                return;
            }

            const payload: GameResignRequest = {
                gameId: gameId,
            }

            socket.emit("game:resign", payload, ((ok, message) => {
                if (!ok) {
                    console.error(message);
                    return;
                }
            }) as GenericCallback)
        } else {
            setConfirming(true);
            resetConfirmingTimeout.current = window.setTimeout(() => {
                setConfirming(false);
            }, 5000)
        }
    }


    function handleCancel() {
        setConfirming(false);
        clearTimeout(resetConfirmingTimeout.current);
    }

    return (
        <div className={"flex flex-row flex-1 gap-1"}>
            <Button
                fullWidth
                variant={confirming ? "filled" : "default"}
                color={confirming ? "red" : undefined}
                onClick={handleClick}
                leftSection={<FaRegFlag size={13}/>}
            >
                {confirming ? "Confirm" : "Resign"}
            </Button>
            {confirming && <Tooltip label={"Cancel"}>
                <ActionIcon variant={"default"} size={36} onClick={handleCancel} aria-label={"Cancel resign"}>
                    <IoClose size={18}/>
                </ActionIcon>
            </Tooltip>}
        </div>
    )
}


export default ResignButton;