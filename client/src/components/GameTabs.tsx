import {type ReactNode, useState} from "react";
import {SegmentedControl} from "@mantine/core";


/** Tabbed secondary content shown below the board on small screens. */
function GameTabs({tabs, defaultTab}: {
    tabs: { id: string, label: string, content: ReactNode }[],
    defaultTab?: string,
}) {
    const [tab, setTab] = useState<string>(defaultTab ?? tabs[0]?.id ?? "");

    return (<div className={"flex flex-col gap-2 w-full mt-3"}>
        <SegmentedControl
            fullWidth
            value={tab}
            onChange={setTab}
            data={tabs.map(t => ({value: t.id, label: t.label}))}
        />
        <div className={"h-[50dvh] min-h-75"}>
            {tabs.find(t => t.id === tab)?.content}
        </div>
    </div>)
}

export default GameTabs;
