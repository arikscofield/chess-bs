import {Button, TextInput} from "@mantine/core";
import {Link, useNavigate} from "react-router";
import {type ReactNode, useState} from "react";
import CreateGameModal from "../../components/CreateGameModal.tsx";
import {FaRobot} from "react-icons/fa";
import {useCreateGame} from "../../hooks/CreateGame.ts";
import {FiArrowRight, FiKey, FiPlus, FiUsers} from "react-icons/fi";
import HeroBoard from "../../components/HeroBoard.tsx";
import {CreateGameMode} from "../../utils/const.ts";
import {useAtomValue} from "jotai";
import {moveColorsAtom} from "../../atoms/settings.ts";
import MiniBoard from "../../components/MiniBoard.tsx";


/** Extract the game code from a string. Accepts bare game code or full game link */
function parseGameCode(input: string): string {
    const trimmed = input.trim();
    try {
        const url = new URL(trimmed);
        return url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    } catch {
        return trimmed.replace(/^\/+|\/+$/g, "");
    }
}


function Step({number, title, diagram, last = false, children}: {
    number: number,
    title: string,
    diagram: ReactNode,
    last?: boolean,
    children: ReactNode,
}) {
    // The marker column/row and its line connect the steps: vertical on mobile, horizontal on md+
    return <div className={"group flex flex-row md:flex-col gap-3 md:gap-4"}>
        <div className={"flex flex-col md:flex-row items-center gap-2 md:gap-3"}>
            <span className={"flex items-center justify-center shrink-0 w-8 h-8 rounded-full border border-fg-1/50 bg-bg-1 text-sm font-semibold text-fg-1 transition-colors group-hover:bg-fg-1 group-hover:text-bg-1"}>
                {number}
            </span>
            {/* Reaches across the grid gap, stopping just short of the next marker */}
            {!last && <span className={"flex-1 w-px md:w-auto md:h-px -mb-2 md:mb-0 md:-mr-1 bg-fg-3/30"}/>}
        </div>
        <div className={"flex-1 flex flex-col gap-4 rounded-xl bg-bg-2/60 border border-white/5 p-5 transition-colors group-hover:border-fg-1/30"}>
            {diagram}
            <div>
                <h3 className={"font-semibold text-fg-2 mb-1"}>{title}</h3>
                <p className={"text-sm text-fg-3 leading-relaxed"}>{children}</p>
            </div>
        </div>
    </div>
}

function Home() {
    const navigate = useNavigate();
    const {createGame, createBotGame, error, clearError} = useCreateGame();

    const moveColors = useAtomValue(moveColorsAtom);

    const [gameCodeInput, setGameCodeInput] = useState<string>("");
    const [modal, setModal] = useState<CreateGameMode>(CreateGameMode.None);

    const gameCode = parseGameCode(gameCodeInput);

    function openModal(mode: CreateGameMode) {
        clearError();
        setModal(mode);
    }

    function joinGame() {
        if (gameCode) navigate(`/${gameCode}`);
    }



    return (
        <div className={"w-full max-w-6xl mx-auto px-1 sm:px-4 pt-4 sm:pt-10 pb-16"}>

            {/* Hero */}
            <section className={"grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center"}>
                <div className={"flex flex-col gap-6"}>
                {/*<span className={"self-start inline-flex items-center gap-2 rounded-full border border-fg-1/30 bg-fg-1/10 px-3 py-1 text-xs font-medium text-fg-1"}>*/}
                {/*    <span className={"w-1.5 h-1.5 rounded-full bg-fg-1"}/>*/}
                {/*    A chess variant*/}
                {/*</span>*/}
                    <h1 className={"text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-fg-2 leading-[1.05]"}>
                        {/*Chess with <span className={"text-fg-1"}>bluffing</span>.*/}
                        <span className={"text-fg-1"}>Bluffing</span> Chess
                    </h1>
                    <p className={"text-base sm:text-lg text-fg-3 max-w-xl leading-relaxed"}>
                        Each player gets secret rules that let their pieces break the rules of chess.
                        Use them, fake them, or call your opponent out when you think they're lying.
                    </p>

                    <div className={"flex flex-col sm:flex-row gap-3"}>
                        <Button size={"lg"} leftSection={<FiPlus size={20}/>} onClick={() => openModal(CreateGameMode.Online)}>
                            Create a game
                        </Button>
                        <Button size={"lg"} variant={"default"} leftSection={<FaRobot size={18}/>} onClick={() => openModal(CreateGameMode.Bot)}>
                            Play a bot
                        </Button>
                    </div>

                    {/* Join by code */}
                    <div className={"flex flex-col gap-2 max-w-md"}>
                        <form
                            className={"flex flex-row gap-2"}
                            onSubmit={e => { e.preventDefault(); joinGame(); }}
                        >
                            <TextInput
                                flex={1}
                                placeholder={"Have a code? Paste it or the link"}
                                aria-label={"Game code or link"}
                                value={gameCodeInput}
                                onChange={e => setGameCodeInput(e.currentTarget.value)}
                                leftSection={<FiKey size={16}/>}
                            />
                            <Button type={"submit"} variant={"light"} disabled={!gameCode}>Join</Button>
                        </form>
                        <Link to={"/games"} className={"group inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-fg-1 transition-colors self-start"}>
                            <FiUsers size={14}/>
                            Browse open public games
                            <FiArrowRight size={14} className={"transition-transform group-hover:translate-x-0.5"}/>
                        </Link>
                    </div>
                </div>

                <div className={"w-full max-w-md mx-auto lg:max-w-none mb-6"}>
                    <HeroBoard/>
                </div>
            </section>

            {/* How to play */}
            <section className={"mt-20 sm:mt-24"}>
                <h2 className={"text-2xl font-bold text-fg-2 mb-1"}>How it works</h2>
                <div className={"grid grid-cols-1 md:grid-cols-3 gap-4"}>
                    <Step
                        number={1}
                        title={"Get secret rules"}
                        diagram={<MiniBoard
                            position={["....p.", "..Q...", ".P...."]}
                            targets={[[0, 0], [0, 4], [2, 0], [2, 4]].map(([row = 0, col = 0]) => ({square: [row, col], color: moveColors.rule}))}
                        />}
                    >
                        Each player is dealt a few hidden rules from the game's rule pool, like a
                        queen that can also move like a knight, or a rook that hops over its own pieces.
                    </Step>
                    <Step
                        number={2}
                        title={"Bluff or call it"}
                        diagram={<MiniBoard
                            position={["..N.p.", ".p....", "...P.."]}
                            highlights={[{square: [2, 2], color: moveColors.bluff}, {square: [0, 2], color: moveColors.bluff}]}
                            badges={[{square: [0, 2], content: <span className={"flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-bg-1/90 text-[10px] sm:text-xs font-bold text-fg-2"}>?</span>}]}
                        />}
                    >
                        On your turn, play a normal move, use one of your rules, or bluff a move you
                        don't actually have. If you think your opponent bluffed, call it instead of moving.
                    </Step>
                    <Step
                        number={3}
                        title={"Take the king"}
                        last={true}
                        diagram={<MiniBoard
                            position={[".k..p.", "......", ".R..K."]}
                            targets={[{square: [1, 1], color: moveColors.regular}, {square: [0, 1], color: moveColors.regular}]}
                        />}
                    >
                        A wrong call or a caught bluff costs a turn. There's no checkmate:
                        you win by capturing the king, or when your opponent runs out of time.
                    </Step>
                </div>
            </section>

            <CreateGameModal
                mode={CreateGameMode.Online}
                opened={modal === CreateGameMode.Online}
                onClose={() => setModal(CreateGameMode.None)}
                onSubmit={createGame}
                error={error}
            />
            <CreateGameModal
                mode={CreateGameMode.Bot}
                opened={modal === CreateGameMode.Bot}
                onClose={() => setModal(CreateGameMode.None)}
                onSubmit={createBotGame}
                error={error}
            />
        </div>
    )
}


export default Home;