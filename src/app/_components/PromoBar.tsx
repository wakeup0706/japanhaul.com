"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function PromoBar() {
    const t = useTranslations("promo");
    const [index, setIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const messages = t.raw("messages") as string[];
    const message = useMemo(() => messages[index % messages.length], [index, messages]);

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
