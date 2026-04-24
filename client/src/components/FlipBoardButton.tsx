import {Button} from "@mantine/core";
import type {SetStateAction} from "react";
import {Color} from "@chess-bs/common";
import {HiMiniArrowsUpDown} from "react-icons/hi2";


function FlipBoardButton({playerColor, setView}: {
    playerColor: Color,
    setView: (prev: SetStateAction<Color | undefined>) => void
}) {

    const opponentColor = playerColor === Color.White ? Color.Black : Color.White;

    return <Button
        variant={"subtle"}
        color={"white"}
        onClick={() => setView((prevColor) => prevColor === opponentColor ? undefined : opponentColor)}
        title={"Flip Board"}
        aria-label={"Flip Board"}
    >
        <HiMiniArrowsUpDown size={15}/>
    </Button>
}


export default FlipBoardButton;