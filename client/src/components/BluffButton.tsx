import {Button, Kbd} from "@mantine/core";
import {type Dispatch, type SetStateAction} from "react"


/** Button for toggling bluff mode */
function BluffButton({ isBluffing, setIsBluffing, disabled = false }: {
    isBluffing: boolean,
    setIsBluffing: Dispatch<SetStateAction<boolean>>,
    disabled: boolean,
}) {

    return (
        <Button
            color={"orange"}
            variant={isBluffing ? "filled" : "light"}
            onClick={() => setIsBluffing((prev) => !prev)}
            disabled={disabled}
            // leftSection={<LuVenetianMask size={18}/>}
            rightSection={<Kbd size={"xs"} className={"hidden sm:inline-block opacity-70"}>Space</Kbd>}
            className={"transition-colors"}
            aria-pressed={isBluffing}
        >
            {isBluffing ? "Stop Bluffing" : "Bluff"}
        </Button>
    )
}


export default BluffButton;