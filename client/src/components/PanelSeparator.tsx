import {Separator} from "react-resizable-panels";


/** Drag handle between vertically stacked resizable panels. */
function PanelSeparator() {
    return <Separator className={"group flex flex-row items-center justify-center h-3 outline-none"}>
        <div className={"w-10 h-1 rounded-full bg-white/10 group-hover:bg-fg-1/60 group-data-[separator=active]:bg-fg-1 transition-colors"}/>
    </Separator>
}

export default PanelSeparator;
