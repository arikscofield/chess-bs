import type {UserDTO} from "@chess-bs/common/"
import {type ReactNode, useEffect, useState} from "react";
import {AuthContext} from "./AuthContext.ts";





// const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;
const SERVER_IP = window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;

const MAX_DELAY_MS = 30_000;
const BASE_DELAY_MS = 500;

function sleep(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("Aborted", "AbortError"));
        });
    });
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchUser() {
            let attempt = 0;
            while (!controller.signal.aborted) {
                try {
                    const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/auth/me`, {
                        method: "GET",
                        credentials: "include",
                        signal: controller.signal,
                    })

                    // Properly logged in with user
                    if (response.ok) {
                        const userData: UserDTO = await response.json();
                        setUser(userData);
                        setIsConnected(true);
                        return;
                    }

                    // Connected to the server, just failed to get user response
                    if (response.status === 401 || response.status === 403) {
                        setUser(null);
                        setIsConnected(true);
                        return;
                    }

                    throw new Error(`Unexpected status when authenticating user ${response.status}`);
                } catch (error) {
                    if (controller.signal.aborted) return;
                    const delay = Math.min(
                        BASE_DELAY_MS * 2 ** attempt + Math.random() * 250,
                        MAX_DELAY_MS,
                    )
                    console.warn(`Auth fetch failed (attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms`, error);
                    attempt++;
                    try {
                        await sleep(delay, controller.signal);
                    } catch {
                        return;
                    }
                }
            }
        }

        fetchUser();

        return () => controller.abort();
    }, []);

    return (
        <AuthContext value={{ user, isConnected }}>
            {children}
        </AuthContext>
    )
}

