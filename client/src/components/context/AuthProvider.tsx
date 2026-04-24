import type {UserDTO} from "@chess-bs/common/"
import {type ReactNode, useEffect, useState} from "react";
import {AuthContext} from "./AuthContext.ts";





// const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;
const SERVER_IP = window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                })

                if (response.ok) {
                    const userData: UserDTO = await response.json();
                    setUser(userData);
                } else {
                    console.error("Failed to authenticate user");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsConnected(true);
            }
        }

        fetchUser();
    }, []);

    return (
        <AuthContext value={{ user, isConnected }}>
            {children}
        </AuthContext>
    )
}

