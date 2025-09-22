import Board from "./Board.tsx";
import {useEffect, useRef, useState} from "react";
import Player from "@chess-bs/common/dist/player.js";
import BoardClass from "@chess-bs/common/dist/board.js";
import {
    AckStatus,
    type ClientToServerEvents,
    Color,
    type GameState,
    type Move,
    type Piece, PieceType, type PlayerState,
    type ServerToClientEvents,
    type Square
} from "@chess-bs/common";
import { Socket } from "socket.io-client";
import {Button, Group} from "@mantine/core";


function Game(
    { gameId, gameState, playerState, socket }:
    { gameId: string, gameState: GameState | null, playerState: PlayerState | null, socket: Socket<ServerToClientEvents, ClientToServerEvents> }
) {
    const player = useRef<Player | null>(null);
    const [view, setView] = useState<Color>(Color.White);
    const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const [promotionMove, setPromotionMove] = useState<Move | null>(null);
    const [isBluffing, setIsBluffing] = useState<boolean>(false);

    // Board data
    const [grid, setGrid] = useState<(Piece | null)[][]>([]);
    const [enPassant, setEnPassant] = useState<Square | null>(null);


    useEffect(() => {
        if (!gameState) return;
        const {grid: newGrid, enPassant: newEnPassant, turn} = gameState;

        setGrid(newGrid);
        setEnPassant(newEnPassant);
        setTurnColor(turn); // TODO: Uncomment
    }, [gameState]);


    useEffect(() => {
        if (!playerState) return;
        player.current = Player.fromPlayerState(playerState);
        setView(playerState.color);
    }, [playerState]);


    // useEffect(() => {
    //     socket.on("gameState", (gameState: GameState) => {
    //         const {gameStatus, grid: newGrid, enPassant: newEnPassant, turn} = gameState;
    //         console.log(`Received Game State: ${gameState}`)
    //
    //         setGameStatus(gameStatus);
    //         setGrid(newGrid);
    //         setEnPassant(newEnPassant);
    //         setTurnColor(turn); // TODO: Uncomment
    //     });
    //
    //     socket.on("playerState", (playerState: PlayerState) => {
    //         console.log(`Received Player State: ${playerState}`)
    //
    //         player.current = Player.fromPlayerState(playerState);
    //         setView(playerState.color);
    //     });
    //
    //     return () => { socket.close(); };
    // }, [socket])

    function handleBluff() {
        setIsBluffing((prev) => !prev);
    }

    function handleCallBluff() {
        socket?.emit("callBluff", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                if (response.result) {
                    console.log("Bluff successful");
                } else {
                    console.log("Bluff failed");
                    // setTurnColor((prev) => prev === Color.White ? Color.Black : Color.White);
                }
            } else {
                console.error(response.message);
            }
        })
    }

    function handleMove(move: Move) {
        socket?.emit("move", gameId, move, (response) => {
            if (response.status === AckStatus.OK) {
                console.log("Move successful")

            } else if (response.status === AckStatus.ERROR) {
                console.error(response.message);
            }
        })
    }


    function handleSelectPromotion(pieceType: PieceType) {
        if (!promotionMove) return;

        const move = promotionMove;
        move.promotion = pieceType;
        handleMove(move);
        setPromotionMove(null);
    }


    return (<div>
        <Board
            board={new BoardClass(grid, enPassant)}
            player={player}
            view={view}
            turn={turnColor}
            isBluffing={isBluffing}
            promotionMove={promotionMove}
            handleMove={handleMove}
            setPromotionMove={setPromotionMove}
            handleSelectPromotion={handleSelectPromotion}
        />
        <Group justify={"center"} gap={50} py={10}>
            <Button color={"red"}
                    onClick={() => {handleBluff();}}
            >
                Bluff
            </Button>
            <Button color={"green"}
                    onClick={() => {handleCallBluff();}}
            >
                Call Bluff
            </Button>
        </Group>

    </div>)
}


export default Game;