import { IoSend } from "react-icons/io5";
import {Button, TextInput} from "@mantine/core";
import {useInputState, useMounted} from "@mantine/hooks";
import {useContext, useEffect, useRef, useState} from "react";
import {SocketContext} from "./Socket/SocketContext.ts";


function Chatroom({gameId, }: {gameId: string}) {
    type Message = {
        user: string;
        message: string;
    }

    const mounted = useMounted();
    const [inputMessage, setInputMessage] = useInputState("");
    const [messages, setMessages] = useState<Message[]>([{user: "user1", message: "test message 1"}, {user: "aaa user2", message: "test message 2222"},]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const socket = useContext(SocketContext);


    useEffect(() => {
        if (mounted) return;

        if (socket) {
            socket.on("chatMessage", (message: string) => {
                addMessage({user: "Opponent", message: message});
            })
        }
    }, [mounted])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);



    function addMessage(message: Message) {
        setMessages(prevMessages => [...prevMessages, message])
        // if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    function handleSendMessage() {
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        if (inputMessage.trim()) {
            addMessage({user: "You", message: inputMessage.trim()});
            socket.emit("chatMessage", gameId, inputMessage.trim());
        }

        setInputMessage("");
    }


    return (<div className={"w-full h-full flex flex-col rounded-md p-2 gap-2 bg-bg-2 text-white"}>
        <h2 className={"w-full text-center text-xl font-bold"}>Chat</h2>

        <div ref={scrollRef} className={"flex flex-col grow overflow-auto min-h-0 "}>
            {messages.map((message, index) => (
                <div key={index} className={"wrap-anywhere "}>
                    <p className={`inline font-bold ${message.user === "You" ? "text-blue-500" : "text-red-500"}`}>{message.user}: </p>
                    <p className={"inline"}>{message.message}</p>
                </div>
            ))}
        </div>

        <div className={"flex flex-row gap-2"}>
            <TextInput
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
                className={""}
            >
                <IoSend/>
            </Button>
        </div>
    </div>)
}


export default Chatroom;