import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {
    GameStatus,
    type GetGameResponse,
    type PlayerDTO,
    type GamePlayerJoinedResponse,
    type GamePlayerStateResponse,
    type GameAbortedResponse,
    type GameStateResponse,
    type GameStartedResponse,
    type GameMoveAppliedResponse,
    type GameMoveBluffCallSucceededResponse,
    type GameMoveBluffCallFailedResponse,
    type GameMoveBluffLostPieceResponse,
    type GameClockStateResponse,
    type GameClockStartedResponse,
    type GameDrawOfferedResponse,
    type GameDrawCancelledResponse,
    type GameDrawDeclinedResponse,
    type GameRematchOfferedResponse,
    type GameRematchCancelledResponse,
    type GameRematchAcceptedResponse,
    type GameRematchDeclinedResponse,
    type GameOverResponse,
    type GameJoinRequest, type GenericCallback
} from "@chess-bs/common";
import {useSocket} from "../../components/context/SocketContext.ts";
import BoardClass from "@chess-bs/common/dist/board.js";
import Lobby from "./Lobby.tsx";

import Replay from "./Replay.tsx";
import {useAuth} from "../../components/context/AuthContext.ts";
import Join from "./Join.tsx";
import Play from "./Play.tsx";
import Spectate from "./Spectate.tsx";
import {useSetAtom} from "jotai";
import {
    addTurnAtom,
    bluffPunishmentAtom,
    clockIncrementMsAtom, clockInfoAtom,
    clockStartMsAtom, clockStartTimestampAtom, gameIdAtom, gameResultAtom, gameResultReasonAtom,
    gameStatusAtom, playerAtom, playersAtom,
    rulePoolIdsAtom, setGameStateAtom,
    startBoardAtom, turnColorAtom, turnHistoryAtom,
    usesClockAtom,
} from "./atoms.ts";


const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;
const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;

function Game() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { user, isConnected } = useAuth();
    const socket = useSocket();

    const [page, setPage] = useState<'join' | 'lobby' | 'play' | 'spectate' | 'replay'>('join');

    const setGameState = useSetAtom(setGameStateAtom);
    const setGameId = useSetAtom(gameIdAtom);
    const setGameStatus = useSetAtom(gameStatusAtom);
    const setStartBoard = useSetAtom(startBoardAtom);
    const setRulePoolIds = useSetAtom(rulePoolIdsAtom);
    const setBluffPunishment = useSetAtom(bluffPunishmentAtom);
    const setPlayers = useSetAtom(playersAtom);
    const setTurnColor = useSetAtom(turnColorAtom);
    const setTurnHistory = useSetAtom(turnHistoryAtom);
    const addTurn = useSetAtom(addTurnAtom);
    const setGameResult = useSetAtom(gameResultAtom);
    const setGameResultReason = useSetAtom(gameResultReasonAtom);

    const setUsesClock = useSetAtom(usesClockAtom);
    const setClockStartMs = useSetAtom(clockStartMsAtom);
    const setClockIncrementMs = useSetAtom(clockIncrementMsAtom);
    const setClockStartTimestamp = useSetAtom(clockStartTimestampAtom);
    const setClockInfo = useSetAtom(clockInfoAtom);

    const setPlayer = useSetAtom(playerAtom);


    // Initial visit to the game page: get game data
    useEffect(() => {

        async function fetchGame() {
            if (!isConnected || !gameId) {
                return;
            }

            try {
                const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/games/${gameId}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    navigate("/");
                    const error = (await response.json()).error;
                    console.error(error);
                    return;
                }

                const gameData: GetGameResponse = await response.json();
                const { gameId: newGameId, gameStatus: newGameStatus, startBoard: newStartBoard,
                    rulePoolIds: newRulePoolIds, turnHistory: newTurnHistory, usesClock: newUsesClock,
                    clockStartMs: newClockStartMs, clockIncrementMs: newClockIncrementMs,
                    bluffPunishment: newBluffPunishment, players: newPlayers}
                    = gameData;
                console.log("Received game data from fetch:", gameData);

                if (newGameId !== gameId) {
                    navigate("/");
                    console.error("Received game data for id", newGameId, "instead of ", gameId);
                    return;
                }

                setGameId(newGameId);
                setGameStatus(newGameStatus);
                setStartBoard(new BoardClass(newStartBoard.grid, newStartBoard.enPassant));
                setRulePoolIds(newRulePoolIds);
                setTurnHistory(newTurnHistory);
                setUsesClock(newUsesClock);
                setClockStartMs(newClockStartMs ?? 0);
                setClockIncrementMs(newClockIncrementMs ?? 0);
                setBluffPunishment(newBluffPunishment);
                setPlayers(newPlayers);
                switch (newGameStatus) {
                    case GameStatus.WAITING_FOR_PLAYER:
                        if (newPlayers.length === 0 || newPlayers.some(player =>  player.userId === user?.userId)) {
                            handleJoinGame(gameId);
                            setPage('lobby')
                            break;
                        }
                        setPage(newPlayers.length === 0 ? 'lobby' : 'join');
                        break;
                    case GameStatus.WAITING_FOR_FIRST_MOVE:
                    case GameStatus.PAUSED:
                    case GameStatus.RUNNING:
                        if (newPlayers.some(player => player.userId === user?.userId)) {
                            handleJoinGame(gameId);
                            setPage('play');
                            // const payload: GameRequestStateRequest = {
                            //     gameId: gameId,
                            // }
                            // socket?.emit("game:request-state", payload, ((ok, message) => {
                            //     if (!ok) {
                            //         console.error(message);
                            //         return;
                            //     }
                            //     console.log(message);
                            // }) as GenericCallback)
                        } else {
                            setPage('spectate');
                        }
                        break;
                    case GameStatus.DONE:
                        setPage('replay');
                        break;
                }



            } catch (error) {
                console.error(error);
                navigate('/')
            }
        }

        fetchGame();

    }, [isConnected]);


    // Setup socket event handlers
    useEffect(() => {

        if (!isConnected || !socket) {
            return;
        }


        function onPlayerJoined(payload: GamePlayerJoinedResponse) {
            console.log("game:player:joined received", payload);
        }

        function onPlayerState(payload: GamePlayerStateResponse) {
            console.log("game:player:state received", payload);
            const newPlayer: PlayerDTO = {
                userId: payload.userId,
                username: payload.username,
                color: payload.color,
                ruleIds: payload.ruleIds,
                clockMs: payload.clockMs
            }
            if (user && newPlayer.userId !== user.userId) {
                console.log("Received player state for other user: ", newPlayer.userId);
                return;
            }

            setPlayer(newPlayer);
        }

        function onGameAborted(payload: GameAbortedResponse) {
            console.log("game:aborted received", payload);
        }

        function onGameState(payload: GameStateResponse) {
            console.log("game:state received", payload);
            setGameState(payload);
        }

        function onGameStarted(payload: GameStartedResponse) {
            console.log("game:started received", payload);
            const {gameStatus, startedAt} = payload;
            setGameStatus(gameStatus);
            setPage('play');
        }

        function onMoveApplied(payload: GameMoveAppliedResponse) {
            console.log("game:move:applied received", payload);
            const {move, turnColor, appliedAt} = payload;

            addTurn(move);
            setTurnColor(turnColor);
        }

        function onBluffCallSucceeded(payload: GameMoveBluffCallSucceededResponse) {
            console.log("game:move:bluff:call-succeeded received", payload);
            const {turnColor, bluffPunishment, punished, turn, appliedAt} = payload;

            setTurnColor(turnColor);
            setBluffPunishment(bluffPunishment);
            addTurn(turn);
        }

        function onBluffCallFailed(payload: GameMoveBluffCallFailedResponse) {
            console.log("game:move:bluff:call-failed received", payload);
            const {turnColor, bluffPunishment, punished, turn, appliedAt} = payload;

            setTurnColor(turnColor);
            setBluffPunishment(bluffPunishment);
            addTurn(turn);
        }

        function onBluffLostPiece(payload: GameMoveBluffLostPieceResponse) {
            console.log("game:move:bluff:lost-piece received", payload);
            // const {turnColor, square, piece, color, appliedAt} = payload;
        }

        function onClockStarted(payload: GameClockStartedResponse) {
            console.log("game:clock:started received", payload);
            const {gameStatus, startedAt} = payload;

            setGameStatus(gameStatus);
            setClockStartTimestamp(startedAt);
        }

        function onClockState(payload: GameClockStateResponse) {
            console.log("game:clock:state received", payload);
            // const {usesClock, startMs, incrementMs, startTimestamp} = payload;

            setClockInfo(payload);
        }

        function onDrawOffered(payload: GameDrawOfferedResponse) {
            console.log("game:draw:offered received", payload);
        }

        function onDrawCancelled(payload: GameDrawCancelledResponse) {
            console.log("game:draw:cancelled received", payload);
        }

        function onDrawDeclined(payload: GameDrawDeclinedResponse) {
            console.log("game:draw:declined received", payload);
        }

        function onRematchOffered(payload: GameRematchOfferedResponse) {
            console.log("game:rematch:offered received", payload);
        }

        function onRematchCancelled(payload: GameRematchCancelledResponse) {
            console.log("game:rematch:cancelled received", payload);
        }

        function onRematchAccepted(payload: GameRematchAcceptedResponse) {
            console.log("game:rematch:accepted received", payload);
            const { newGameId } = payload;

            navigate(`/${newGameId}`);
            setGameId(newGameId);
            handleJoinGame(newGameId);
        }

        function onRematchDeclined(payload: GameRematchDeclinedResponse) {
            console.log("game:rematch:declined received", payload);
        }

        function onGameOver(payload: GameOverResponse) {
            console.log("game:over received", payload);
            const {result, reason} = payload;
            setGameStatus(GameStatus.DONE);
            setGameResult(result);
            setGameResultReason(reason);
        }


        socket.on('game:player:joined', onPlayerJoined);
        socket.on('game:player:state', onPlayerState);
        socket.on('game:aborted', onGameAborted);
        socket.on('game:state', onGameState);
        socket.on('game:started', onGameStarted);
        socket.on('game:move:applied', onMoveApplied);
        socket.on('game:move:bluff:call-succeeded', onBluffCallSucceeded);
        socket.on('game:move:bluff:call-failed', onBluffCallFailed);
        socket.on('game:move:bluff:lost-piece', onBluffLostPiece);
        socket.on('game:clock:started', onClockStarted);
        socket.on('game:clock:state', onClockState);
        socket.on('game:draw:offered', onDrawOffered);
        socket.on('game:draw:cancelled', onDrawCancelled);
        socket.on('game:draw:declined', onDrawDeclined);
        socket.on('game:rematch:offered', onRematchOffered);
        socket.on('game:rematch:cancelled', onRematchCancelled);
        socket.on('game:rematch:accepted', onRematchAccepted);
        socket.on('game:rematch:declined', onRematchDeclined);
        socket.on('game:over', onGameOver);


        // Cleanup
        return () => {

            socket.off('game:player:joined', onPlayerJoined);
            socket.off('game:player:state', onPlayerState);
            socket.off('game:aborted', onGameAborted);
            socket.off('game:state', onGameState);
            socket.off('game:started', onGameStarted);
            socket.off('game:move:applied', onMoveApplied);
            socket.off('game:move:bluff:call-succeeded', onBluffCallSucceeded);
            socket.off('game:move:bluff:call-failed', onBluffCallFailed);
            socket.off('game:move:bluff:lost-piece', onBluffLostPiece);
            socket.off('game:clock:started', onClockStarted);
            socket.off('game:clock:state', onClockState);
            socket.off('game:draw:offered', onDrawOffered);
            socket.off('game:draw:cancelled', onDrawCancelled);
            socket.off('game:draw:declined', onDrawDeclined);
            socket.off('game:rematch:offered', onRematchOffered);
            socket.off('game:rematch:cancelled', onRematchCancelled);
            socket.off('game:rematch:accepted', onRematchAccepted);
            socket.off('game:rematch:declined', onRematchDeclined);
            socket.off('game:over', onGameOver);
        }
    }, [isConnected, gameId]);


    function handleJoinGame(gameId: string): void {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        const payload: GameJoinRequest = {
            gameId: gameId,
        }
        socket.emit("game:join", payload, ((ok, message, data) => {
            if (!ok) {
                navigate("/");
                console.error(message);
                return;
            }
            console.log(`Joined game: ${gameId}`)
            console.log(`Got socket game state:`)
            console.log(data)
            setGameState(data as GameStateResponse);
            return;
        }) as GenericCallback);
    }

    // function startTimers() {
    //     if (timerInterval.current) return;
    //     timerUpdateTimestamp.current = Date.now();
    //     timerInterval.current = setInterval(() => {
    //         setTimers(prevTimers => {
    //             const newTimers = new Map(prevTimers);
    //             const now = Date.now();
    //             const elapsed = now - timerUpdateTimestamp.current;
    //             const current = newTimers.get(turnColor.current);
    //             if (current === undefined) return newTimers;
    //             newTimers.set(turnColor.current, Math.max(0, current - elapsed));
    //             timerUpdateTimestamp.current = now;
    //             return newTimers;
    //         })
    //     }, 100)
    // }

    // function endTimers() {
    //     if (timerInterval.current)
    //         clearInterval(timerInterval.current);
    //     timerInterval.current = null;
    // }


    switch (page) {
        case "join":
            return (<Join handleJoinGame={handleJoinGame} />)
        case "lobby":
            return (<Lobby/>)
        case "play":
            return (<Play/>)
        case "spectate":
            return (<Spectate/>)
        case "replay":
            return (<Replay/>)
    }
}


export default Game;