import {Button} from "@mantine/core";
import {type Dispatch, type SetStateAction, useEffect} from "react"

function BluffButton({ isBluffing, setIsBluffing }: {isBluffing: boolean, setIsBluffing:  Dispatch<SetStateAction<boolean>>}) {


    // Hotkeys
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {

            switch (e.key) {
                case " ": // Space bar toggles bluffing
                    if (document.activeElement && document.activeElement == document.getElementById("chat-input"))
                        break;
                    setIsBluffing((prev) => !prev);
                    break;

            }
        }
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setIsBluffing])

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