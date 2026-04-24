import {createContext, useContext} from "react";
import type {UserDTO} from "@chess-bs/common/"


type AuthContextType = {
    user: UserDTO | null,
    isConnected: boolean,
}

export const AuthContext = createContext<AuthContextType>({user: null, isConnected: false});

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}