"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MESSAGES = [
    "Use code LAUNCH30 to get 30% OFF!",
    "We're still shipping to the U.S. via private carriers",
    "Preorder now & save 20% on Advent Calendars!",
];

export default function PromoBar() {
    const [index, setIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const message = useMemo(() => MESSAGES[index % MESSAGES.length], [index]);

    useEffect(() => {
        intervalRef.current = setInterval(() => setIndex((i) => i + 1), 4000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <div className="bg-black text-white text-center text-xs sm:text-sm py-3 px-3">
            <div className="w-full flex items-center justify-center gap-3">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                <div className="relative h-5 overflow-hidden" aria-live="polite">
                    <div key={index} className="animate-[fadeSlide_400ms_ease] whitespace-nowrap">
                        <span className="font-medium">{message}</span>
                    </div>
                </div>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
            </div>
            <style jsx>{`
                @keyframes fadeSlide {
                    0% { opacity: 0; transform: translateY(6px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
