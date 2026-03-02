import { useState } from "react";

import { Doc } from "@/components/Doc";

import { ClipboardClock, Settings2 } from "lucide-react";

import Reservations from "./sections/resevations";
import Config from "./sections/config";

export default function HomePage() {
    const [active, setActive] = useState("reservations");

    const sections = [
        { id: "reservations", text: "Rezervari", icon: ClipboardClock, component: Reservations },
        { id: "config", text: "Configurari", icon: Settings2, component: Config },
    ];

    const ActiveSection = sections.find(section => section.id === active)?.component;

    return (
        <div className="w-full h-full relative">
            <div className="px-8 pt-10 pb-32">
                {ActiveSection ? <ActiveSection /> : null}
            </div>

            <Doc 
                menus={sections.map(({ id, text, icon }) => ({ id, text, icon }))}
                selectedId={active}
                onSelect={setActive}
                showOnlyIconsThreshold={375}
            />

        </div>
    );
}