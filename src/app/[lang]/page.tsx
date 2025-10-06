import Link from "next/link";
import Image from "next/image";

export default async function LocalizedHome({ params }: { params: Promise<{ lang: string }> }) {
    const { lang: rawLang } = await params;
    const lang = rawLang === "ja" ? "ja" : "en";

    const copy = {
        en: {
            bundleTitle: "Japanese Halloween Bundle",
            bundleDesc: "Trick or treat yourself to this devilishly good Halloween Bundle! Featuring all the best Halloween snacks Japan has to offer!",
            viewCollection: "View Collection",
            spotlight1: "Pokemon Halloween Collection",
            spotlight2: "Starbucks Tsukimi Collection",
        },
        ja: {
            bundleTitle: "日本のハロウィンバンドル",
            bundleDesc: "日本のベストなハロウィンスナックを詰め合わせたスペシャルバンドル！",
            viewCollection: "コレクションを見る",
            spotlight1: "ポケモン ハロウィン コレクション",
            spotlight2: "スターバックス 月見 コレクション",
        },
    }[lang];

    const gridCards = Array.from({ length: 8 }).map((_, i) => i);

    return (
        <section>
            {/* Hero and side spotlights */}
            <div className="w-full px-6 lg:px-10 py-8 mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hero */}
                <div className="relative col-span-2 overflow-hidden rounded-2xl border bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
                    <div className="relative p-6 sm:p-8 md:p-10">
                        <div className="text-xs uppercase tracking-wide opacity-90 mb-2">Seasonal Exclusive</div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">{copy.bundleTitle}</h1>
                        <p className="mt-4 max-w-xl text-sm sm:text-base opacity-95">{copy.bundleDesc}</p>
                        <Link href={`/${lang}/products`} className="mt-6 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-sm">
                            Shop Now
                        </Link>
                    </div>
                </div>

                {/* Spotlight cards */}
                <div className="grid grid-rows-2 gap-4">
                    <div className="relative overflow-hidden rounded-2xl border bg-indigo-100">
                        <div className="p-5">
                            <div className="text-[10px] uppercase tracking-wide text-indigo-600">Limited Quantity</div>
                            <div className="mt-1 text-lg font-semibold">{copy.spotlight1}</div>
                            <Link href={`/${lang}/products`} className="mt-4 inline-block rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white">
                                {copy.viewCollection}
                            </Link>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border bg-emerald-100">
                        <div className="p-5">
                            <div className="text-[10px] uppercase tracking-wide text-emerald-700">Limited Quantity</div>
                            <div className="mt-1 text-lg font-semibold">{copy.spotlight2}</div>
                            <Link href={`/${lang}/products`} className="mt-4 inline-block rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white">
                                {copy.viewCollection}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product grid placeholder */}
            <div className="w-full px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {gridCards.map((i) => (
                    <Link key={i} href={`/${lang}/products/p${i + 1}`} className="group block">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-white group-hover:shadow-sm transition">
                            <Image src="/placeholder.jpg" alt={`Product ${i + 1}`} width={600} height={600} className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-2 text-sm leading-tight">
                            <div className="font-bold group-hover:underline">Product {i + 1}</div>
                            <div className="mt-0.5 text-[13px]">
                                <span className="font-semibold text-black">${((i + 1) * 3).toFixed(2)} USD</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
