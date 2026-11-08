import {useNavigate} from "react-router";
import type {CreateBotGameRequest, CreateGameRequest, CreateGameResponse} from "@chess-bs/common";
import {useState} from "react";
import {API_BASE} from "../utils/api.ts";

/**
 * Creates online or bot games through REST API and navigates to the new game.
 */
export function useCreateGame() {
    const navigate = useNavigate();
    const [error, setError] = useState<string>("");

    async function post(path: string, payload: CreateGameRequest | CreateBotGameRequest): Promise<boolean> {
        setError("");

        try {
            const response = await fetch(`${API_BASE}${path}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const message = data.error ?? data.message ?? `Couldn't create the game (${response.status})`;
                console.error(message);
                setError(typeof message === "string" ? message : "Couldn't create the game");
                return false;
            }

            const data: CreateGameResponse = await response.json();
            console.log(`Created game: ${data.gameId}`);
            navigate(`/${data.gameId}`);
            return true;
        } catch (e) {
            console.error(e);
            setError("Couldn't reach the server. Please try again.");
            return false;
        }
    }

    return {
        createGame: (payload: CreateGameRequest) => post("/api/games", payload),
        createBotGame: (payload: CreateBotGameRequest) => post("/api/games/bot", payload),
        error,
        clearError: () => setError(""),
    }
}