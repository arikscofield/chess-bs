import {Button} from "@mantine/core";
import type {Dispatch, SetStateAction} from "react"

function BluffButton({ isBluffing, setIsBluffing }: {isBluffing: boolean, setIsBluffing:  Dispatch<SetStateAction<boolean>>}) {


    return (
        <Button
            color={isBluffing ? "orange" : "red"}
            w={120}
            onClick={() => setIsBluffing((prev) => !prev)}
            className={"transition-colors"}
        >
            {isBluffing ? "Stop Bluffing" : "Bluff"}
        </Button>
    )
}


export default BluffButton;