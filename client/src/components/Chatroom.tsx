import { IoSend } from "react-icons/io5";
import {ActionIcon, TextInput} from "@mantine/core";
import {useInputState} from "@mantine/hooks";
import {useEffect, useRef, useState} from "react";
import {useSocket} from "./context/SocketContext.ts";
import type {GameChatMessageResponse, GameChatSystemResponse, GameChatSendRequest, GenericCallback} from "@chess-bs/common";
import {useAuth} from "./context/AuthContext.ts";


const PLAYER_COLOR = "text-fg-1";
const OPPONENT_COLOR = "text-orange-300";
const ERROR_COLOR = "text-red-300";
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


    return (<div className={"w-full h-full flex flex-col"}>
        <div ref={scrollRef} className={"flex flex-col gap-1 grow overflow-auto min-h-0 px-3 py-2 text-sm"}>
            {messages.map((message, index) => message.centered
                ? <div key={index} className={`self-center text-center text-xs rounded-full bg-white/5 px-2.5 py-1 my-0.5 ${message.messageColor ?? "text-fg-3"}`}>
                    {message.message}
                </div>
                : <div key={index} className={"wrap-anywhere leading-snug"}>
                    {message.username && <span className={`font-semibold ${message.usernameColor ?? ""}`}>{message.username} </span>}
                    <span className={message.messageColor ?? "text-fg-2"}>{message.message}</span>
                </div>
            )}

            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-fg-3/70 text-sm">
                    No messages yet
                </div>
            )}
        </div>

        {canSend && <div className={"p-2 border-t border-white/5 shrink-0"}>
            <TextInput
                id={"chat-input"}
                value={inputMessage}
                onChange={setInputMessage}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        handleSendMessage();
                    }
                }}
                placeholder={"Send a message"}
                aria-label={"Chat message"}
                maxLength={200}
                rightSection={<ActionIcon
                    variant={"subtle"}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    aria-label={"Send message"}
                >
                    <IoSend size={14}/>
                </ActionIcon>}
            />
        </div>}
    </div>)
}


export default Chatroom;