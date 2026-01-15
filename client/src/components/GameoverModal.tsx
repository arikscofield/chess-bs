import {Color, GameResult} from "@chess-bs/common";
import {Modal} from "@mantine/core";


function GameoverModal(
    {opened, onClose, playerColor, gameResult, reason, }:
    {opened: boolean, onClose: () => void, playerColor: Color, gameResult: GameResult, reason: string, }) {






    return <Modal
        opened={opened}
        onClose={onClose}
        size={"auto"}
        title={gameResult === GameResult.Tie ? "You Tied" : gameResult === playerColor ? "You Won!" : "You Lost"}
        centered
        classNames={{body: "flex flex-col justify-center items-center bg-bg-2 ", close: "text-white! hover:bg-bg-2! hover:text-gray-400! "}}
        styles={{ title: {fontSize: "2em", textAlign: "center", color: "white"}, header: {backgroundColor: "var(--color-bg-2)"} }}
        overlayProps={{
            display: 'none'
        }}
    >
        <div className="w-[200px] h-[100px] text-white ">
            <p>{reason}</p>
        </div>

    </Modal>
}


export default GameoverModal;