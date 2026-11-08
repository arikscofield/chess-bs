import type {ReactNode} from "react";


/** Consistent titled container for the side panels on the game pages. */
function GamePanel({title, icon, actions, children, className = "", bodyClassName = ""}: {
    title?: ReactNode,
    icon?: ReactNode,
    actions?: ReactNode,
    children: ReactNode,
    className?: string,
    bodyClassName?: string,
}) {
    return (<section className={`flex flex-col h-full min-h-0 rounded-xl bg-bg-2/70 border border-white/5 overflow-hidden ${className}`}>
        {title && <header className={"flex flex-row items-center justify-between gap-2 px-3 h-10 shrink-0 border-b border-white/5"}>
            <div className={"flex flex-row items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-3"}>
                {icon}
                {title}
            </div>
            {actions}
        </header>}
        <div className={`flex-1 min-h-0 ${bodyClassName}`}>
            {children}
        </div>
    </section>)
}

export default GamePanel;
