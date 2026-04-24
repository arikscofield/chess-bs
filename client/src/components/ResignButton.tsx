import {Button} from "@mantine/core";
import { FaRegFlag, } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {GameResignRequest, GenericCallback} from "@chess-bs/common";

function ResignButton({gameId}: {gameId: string}) {
    const socket = useSocket();

    const [confirming, setConfirming] = useState<boolean>(false);

    const resetConfirmingTimeout = useRef<number>(0);



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
            resetConfirmingTimeout.current = setTimeout(() => {
                setConfirming(false);
            }, 5000)
        }
    }


    function handleCancel() {
        setConfirming(false);
        clearTimeout(resetConfirmingTimeout.current);
    }

    return (
        <div className={"flex justify-center relative"}>
            <Button
                color={confirming ? "orange" : "red"}
                onClick={handleClick}
                mr={0}
                className={`transition-colors `}
            >
                <FaRegFlag />
            </Button>
            {confirming && <button
                onClick={handleCancel}
                className={`block absolute items-center h-full right-[-30px] m-0 p-0 text-fg-1 hover:bg-fg-1/20 hover:cursor-pointer rounded-md px-1.5`}
            >
                <IoClose size={20}/>
            </button>}
        </div>

    )
}


export default ResignButton;