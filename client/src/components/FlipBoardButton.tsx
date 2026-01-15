import {Button} from "@mantine/core";
import type {Dispatch, SetStateAction} from "react";
import {Color} from "@chess-bs/common";
import {HiMiniArrowsUpDown} from "react-icons/hi2";


function FlipBoardButton(
    {setView, color="var(--color-bg-2)"}:
    {setView: Dispatch<SetStateAction<Color>>, color?: string}
) {



    return <Button
        color={color}
        onClick={() => setView((prevColor) => prevColor === Color.White ? Color.Black : Color.White)}
        title={"Flip Board"}
        aria-label={"Flip Board"}
    >
        <HiMiniArrowsUpDown size={15}/>
    </Button>
}


export default FlipBoardButton;