import { IoSend } from "react-icons/io5";
import {Button, TextInput} from "@mantine/core";
import {useInputState} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {GameChatMessageResponse, GameChatSystemResponse, GameChatSendRequest, GenericCallback} from "@chess-bs/common";
import {useAuth} from "./context/AuthContext.ts";


const PLAYER_COLOR = "text-blue-500";
const OPPONENT_COLOR = "text-red-400/80";
const ERROR_COLOR = "text-red-300/80";
const SYSTEM_COLOR = "text-fg-3";

function Chatroom({gameId, canSend = true}: {gameId: string, canSend?: boolean}) {
    type Message = {
        username?: string;
        usernameColor?: string;
        message: string;
        messageColor?: string;
        centered?: boolean;
    };

    const [inputMessage, setInputMessage] = useInputState("");
    const [messages, setMessages] = useState<Message[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const socket = useSocket();
    const {user} = useAuth();


    useEffect(() => {

        if (!socket) return;

        function onMessage(payload: GameChatMessageResponse) {
            const message: Message = {
                username: payload.username,
                usernameColor: OPPONENT_COLOR,
                message: payload.message,
            };
            setMessages(prevMessages => [...prevMessages, message]);
        }

        function onSystem(payload: GameChatSystemResponse) {
            const message: Message = {
                username: "",
                message: payload.message,
                messageColor: SYSTEM_COLOR,
                centered: true,
            };
            setMessages(prevMessages => [...prevMessages, message]);
        }

        socket.on("game:chat:message", onMessage);
        socket.on("game:chat:system", onSystem);

        return () => {
            socket.off("game:chat:message", onMessage);
            socket.off("game:chat:system", onSystem);
        }
    }, [socket])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);


    function handleSendMessage() {
        if (!canSend) return;
        if (!socket) {
            console.error("context not connected");
            return;
        }

        const trimmedMessage = inputMessage.trim();
        if (trimmedMessage) {
            const payload: GameChatSendRequest = {
                gameId: gameId,
                message: trimmedMessage,
            }
            socket.emit("game:chat:send", payload, ((ok, message) => {
                if (ok) {
                    setMessages(prevMessages => [...prevMessages, {username: user?.username ?? "You", usernameColor: PLAYER_COLOR, message: trimmedMessage}]);
                } else {
                    setMessages(prevMessages => [...prevMessages, {message: "Failed to send message" + message ? `: ${message}` : '', messageColor: ERROR_COLOR}]);
                }
            }) as GenericCallback);
        }

        setInputMessage("");
    }


    return (<div className={"w-full h-full flex flex-col rounded-lg p-2 gap-2 bg-bg-2 text-white"}>
        <div ref={scrollRef} className={"flex flex-col grow overflow-auto min-h-0 "}>
            {messages.map((message, index) => (
                <div key={index} className={`wrap-anywhere ${message.centered && "text-center"}`}>
                    {message.username && <p className={`inline font-semibold ${message.usernameColor ?? ""}`}>{message.username}: </p>}
                    <p className={`inline ${message.messageColor ?? "text-fg-2"}`}>{message.message}</p>
                </div>
            ))}

            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-fg-3/50 text-sm">
                    No messages yet
                </div>
            )}
        </div>

        {canSend && <div className={"flex flex-row gap-2"}>
            <TextInput
                id={"chat-input"}
                value={inputMessage}
                onChange={setInputMessage}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        handleSendMessage();
                    }
                }}
                placeholder={"Message"}
                maxLength={200}
                classNames={{
                    input: "bg-bg-1"
                }}
                className={"grow rounded-md bg-bg-1 "}
            />
            <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={""}
                color={"var(--color-fg-1)"}
            >
                <IoSend/>
            </Button>
        </div>}
    </div>)
}


export default Chatroom;