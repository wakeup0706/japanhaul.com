import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import HeroCarousel from "@/app/_components/HeroCarousel";

export default async function LocalizedHome({ params }: { params: Promise<{ lang: string }> }) {
    const { lang: rawLang } = await params;
    const lang = rawLang === "ja" ? "ja" : "en";
    const t = await getTranslations({ locale: lang });

    const gridCards = Array.from({ length: 8 }).map((_, i) => i);

    return (
        <section>
            {/* Hero Carousel */}
            <div className="w-full px-6 lg:px-10 py-8 mb-6">
                <HeroCarousel lang={lang} />
            </div>

            {/* Product grid placeholder */}
            <div className="w-full px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {gridCards.map((i) => (
                    <Link key={i} href={`/${lang}/products/p${i + 1}`} className="group block">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-white group-hover:shadow-sm transition">
                            <Image src="/placeholder.jpg" alt={`${t("home.product")} ${i + 1}`} width={600} height={600} className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-2 text-sm leading-tight">
                            <div className="font-bold group-hover:underline">{t("home.product")} {i + 1}</div>
                            <div className="mt-0.5 text-[13px]">
                                <span className="font-semibold text-black">{t("home.price", { value: ((i + 1) * 3).toFixed(2) })}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
