import Link from "next/link";

export default function Header({ lang }: { lang: "en" | "ja" }) {
    return (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
            <div className="w-full px-4 py-3 flex items-center gap-4">
                {/* Logo */}
                <Link href={`/${lang}`} className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-semibold">JH</span>
                    <span className="text-lg font-semibold">JapanHaul</span>
                </Link>
                {/* Search */}
                <div className="flex-1">
                    <label className="relative block">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {/* magnifier */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.21 12.02l3.76 3.76a.75.75 0 1 0 1.06-1.06l-3.76-3.76A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd"/></svg>
                        </span>
                        <input
                            type="search"
                            placeholder={lang === "ja" ? "商品を検索…" : "Search products…"}
                            className="w-full rounded-full border px-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                    </label>
                </div>
                {/* Actions */}
                <nav className="flex items-center gap-3 text-sm">
                    <Link href={`/${lang}/login`} className="flex items-center gap-1 hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Zm7 18.25A7.75 7.75 0 0 0 11.25 12h-1.5A7.75 7.75 0 0 0 2 20.25c0 .414.336.75.75.75h17.5a.75.75 0 0 0 .75-.75Z"/></svg>
                        <span className="hidden sm:inline">{lang === "ja" ? "ログイン" : "Log in"}</span>
                    </Link>
                    <Link href={`/${lang}/cart`} className="relative inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M2.25 3a.75.75 0 0 0 0 1.5h1.306l2.65 9.278A3 3 0 0 0 9.09 16.5h7.32a3 3 0 0 0 2.884-2.222l1.494-5.353A.75.75 0 0 0 20.07 8.5H6.246L5.37 5.5h14.38a.75.75 0 0 0 0-1.5H5.003a1.5 1.5 0 0 0-1.445 1.098L3.556 6.5H2.25ZM9 18.75A1.75 1.75 0 1 0 9 22.25a1.75 1.75 0 0 0 0-3.5Zm8.25 1.75a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"/></svg>
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">0</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
