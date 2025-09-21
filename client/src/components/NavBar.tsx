import {useState} from "react";
import { IoMenu, IoClose } from "react-icons/io5";

function NavBar() {

    const [isOpen, setIsOpen] = useState(false);


    const pathname = window.location.pathname;
    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/play", label: "Play" },
    ]

    return (
        <div className="top-0 z-30 m-0 p-0 justify-between items-center text-xl text-white transition-colors bg-fg-2 drop-shadow-sm shadow-md ">
            <div className={"min-h-12 max-h-20 flex items-center px-3 sm:px-6 lg:px-8 "}>

                {/* Desktop NavBar */}
                <div className="w-full hidden md:flex items-center justify-between py-1">
                    <ul className="flex items-center m-0 p-0 list-none gap-0">
                        {navLinks.map((link) => (
                            <li key={link.label} className={`block mx-3 text-center transition hover:text-gray-600 hover:dark:text-gray-300 border-b-4  ${pathname === link.href ? " border-blue-500" : "border-b-transparent"}`}>
                                <a href={link.href} className={"w-full h-full  px-4 py-1.5"}>
                                    <span>{link.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Right-side */}
                    <div className={"flex flex-row justify-around gap-5"}>

                        {/* Theme toggle */}
                        {/*<button className={"m-0 p-0 border-0 "}*/}
                        {/*        onClick={handleToggleTheme}*/}
                        {/*        aria-label={"Toggle theme"}*/}
                        {/*>*/}
                        {/*    {resolvedTheme === "light"*/}
                        {/*        ? <Moon size={40}></Moon>*/}
                        {/*        : <Sun size={40}></Sun>*/}
                        {/*    }*/}
                        {/*</button>*/}
                    </div>


                </div>


                {/* Mobile NavBar */}
                <div className="w-full flex py-1 items-center justify-end gap-3 md:hidden">

                    {/* Theme toggle */}
                    {/*<button className={"mx-3 p-0 border-0"}*/}
                    {/*        onClick={handleToggleTheme}*/}
                    {/*        aria-label={"Toggle theme"}*/}
                    {/*>*/}
                    {/*    {resolvedTheme === "light"*/}
                    {/*        ? <Moon size={40}></Moon>*/}
                    {/*        : <Sun size={40}></Sun>*/}
                    {/*    }*/}
                    {/*</button>*/}

                    {/* Hamburger Button */}
                    <button
                        onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
                        aria-controls={"mobile-menu"}
                        aria-expanded={isOpen}
                        className={""}
                    >
                        {isOpen ? <IoClose size={40} /> : <IoMenu size={40} /> }
                    </button>
                </div>
            </div>


            {/* Collapsible size mobile menu */}
            <div
                className={"md:hidden overflow-hidden bg-white dark:bg-gray-700 transition-[max-height] duration-500 ease-in-out "}
                style={{ maxHeight: isOpen ? `${navLinks.length * 48 + 60}px` : "0px"}}
            >
                <div className={"px-3 pt-2 pb-4"}>
                    <ul>
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className={`block py-2 hover:text-gray-600 hover:dark:text-gray-300 `}
                                >
                                    <span className={`border-b-2 ${pathname === link.href ? "border-blue-500" : "border-transparent"}`}>{link.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}



export default NavBar;