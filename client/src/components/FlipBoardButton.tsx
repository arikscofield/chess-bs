import {ActionIcon, Tooltip} from "@mantine/core";
import type {SetStateAction} from "react";
import {Color} from "@chess-bs/common";
import {HiMiniArrowsUpDown} from "react-icons/hi2";


function FlipBoardButton({playerColor, setView}: {
    playerColor: Color,
    setView: (prev: SetStateAction<Color | undefined>) => void
}) {

    const opponentColor = playerColor === Color.White ? Color.Black : Color.White;

    return <Tooltip label={"Flip board"}>
        <ActionIcon
            variant={"subtle"}
            color={"gray"}
            size={"lg"}
            onClick={() => setView((prevColor) => prevColor === opponentColor ? undefined : opponentColor)}
            aria-label={"Flip board"}
        >
            <HiMiniArrowsUpDown size={16}/>
        </ActionIcon>
    </Tooltip>
}


export default FlipBoardButton;